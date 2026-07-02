const API_BASE = import.meta.env.VITE_API_URL || 'https://alikamobility.alika-konnect.com/api';

class AuthStore {
  constructor() {
    this._token = null;
    this._model = null;
    this._listeners = [];
    this._load();
  }

  get token() { return this._token; }
  get model() { return this._model; }
  get isValid() { return !!this._token; }

  save(token, model) {
    this._token = token;
    this._model = model;
    if (token) {
      localStorage.setItem('api_token', token);
      localStorage.setItem('api_user', JSON.stringify(model));
    } else {
      localStorage.removeItem('api_token');
      localStorage.removeItem('api_user');
    }
    this._notify(token, model);
  }

  clear() {
    this.save(null, null);
  }

  onChange(callback) {
    this._listeners.push(callback);
    return () => {
      this._listeners = this._listeners.filter(l => l !== callback);
    };
  }

  _load() {
    const token = localStorage.getItem('api_token');
    const user = localStorage.getItem('api_user');
    if (token) {
      this._token = token;
      if (user) {
        try { this._model = JSON.parse(user); } catch { this._model = null; }
      }
    }
  }

  _notify(token, model) {
    this._listeners.forEach(l => l(token, model));
  }
}

class CollectionClient {
  constructor(name, authStore) {
    this._name = name;
    this._authStore = authStore;
  }

  _headers() {
    const h = { 'Content-Type': 'application/json' };
    if (this._authStore.token) {
      h['Authorization'] = `Bearer ${this._authStore.token}`;
    }
    return h;
  }

  _url(path = '') {
    return `${API_BASE}/collections/${this._name}/records${path}`;
  }

  async _fetch(url, options = {}) {
    const res = await fetch(url, options);
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.error || data.message || 'Request failed');
      err.status = res.status;
      err.response = data;
      throw err;
    }
    return data;
  }

  async getList(page = 1, perPage = 50, options = {}) {
    const { filter, sort, expand, $autoCancel, ...rest } = options;
    const params = new URLSearchParams();
    const safePerPage = Math.min(Math.max(1, perPage), 500);
    params.set('page', page);
    params.set('perPage', safePerPage);
    if (filter) params.set('filter', filter);
    if (sort) params.set('sort', sort);
    Object.entries(rest).forEach(([k, v]) => {
      if (v !== undefined) params.set(k, v);
    });
    return this._fetch(`${this._url()}?${params}`, { headers: this._headers() });
  }

  /**
   * Fetch all records for small collections (e.g., parkings, vehicle_types).
   * For large collections (members, payments, etc.), prefer getList() with
   * pagination controls instead.
   */
  async getFullList(options = {}) {
    const { filter, sort, expand, $autoCancel, ...rest } = options;
    const params = new URLSearchParams();
    params.set('perPage', '500');
    params.set('skipTotal', '1');
    if (filter) params.set('filter', filter);
    if (sort) params.set('sort', sort);
    Object.entries(rest).forEach(([k, v]) => {
      if (v !== undefined) params.set(k, v);
    });
    const result = await this._fetch(`${this._url()}?${params}`, { headers: this._headers() });
    return result.items || [];
  }

  /**
   * Automatically paginate through all pages for large collections.
   * Use this when you truly need ALL records (e.g., for offline cache).
   * Prefer getList() with pagination UI for normal usage.
   */
  async getAllPaginated(options = {}) {
    const { filter, sort, ...rest } = options;
    const perPage = 500;
    let page = 1;
    let allItems = [];
    let totalPages = 1;

    while (page <= totalPages) {
      const result = await this.getList(page, perPage, { filter, sort, ...rest });
      allItems = allItems.concat(result.items || []);
      totalPages = result.totalPages || 1;
      page++;
    }

    return allItems;
  }

  async getOne(id, options = {}) {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([k, v]) => {
      if (v !== undefined) params.set(k, v);
    });
    const qs = params.toString();
    return this._fetch(`${this._url()}/${id}${qs ? '?' + qs : ''}`, { headers: this._headers() });
  }

  async create(data, options = {}) {
    const isFormData = data instanceof FormData;
    const headers = { Authorization: `Bearer ${this._authStore.token}` };
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    return this._fetch(this._url(), {
      method: 'POST',
      headers,
      body: isFormData ? data : JSON.stringify(data),
    });
  }

  async update(id, data, options = {}) {
    const isFormData = data instanceof FormData;
    const headers = { Authorization: `Bearer ${this._authStore.token}` };
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    return this._fetch(`${this._url()}/${id}`, {
      method: 'PATCH',
      headers,
      body: isFormData ? data : JSON.stringify(data),
    });
  }

  async delete(id, options = {}) {
    return this._fetch(`${this._url()}/${id}`, {
      method: 'DELETE',
      headers: this._headers(),
    });
  }

  async authWithPassword(email, password) {
    const data = await this._fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const record = data.user;
    // Set token in auth store
    this._authStore.save(data.token, record);
    return { record, token: data.token };
  }
}

class ApiClient {
  constructor() {
    this.authStore = new AuthStore();
    this._validationPromise = this._validateOnLoad();
  }

  collection(name) {
    return new CollectionClient(name, this.authStore);
  }

  getFileUrl(record, filename) {
    if (!record || !filename) return null;
    const colName = record['@collectionName'];
    if (!colName || !record.id) return filename;
    return `${API_BASE}/files/${colName}/${record.id}/${filename}`;
  }

  async request(path, options = {}) {
    const { method = 'GET', params, body, headers: extraHeaders } = options;
    let url = `${API_BASE}${path}`;
    if (params) {
      const qs = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') qs.set(k, v);
      });
      const qstr = qs.toString();
      if (qstr) url += '?' + qstr;
    }
    const headers = { 'Authorization': `Bearer ${this.authStore.token}` };
    if (body && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    Object.assign(headers, extraHeaders);
    const res = await fetch(url, {
      method,
      headers,
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.error || data.message || 'Request failed');
      err.status = res.status;
      err.response = data;
      throw err;
    }
    return data;
  }

  get files() {
    return {
      getUrl: (record, filename) => this.getFileUrl(record, filename),
    };
  }

  get ready() {
    return this._validationPromise;
  }

  async _validateOnLoad() {
    const token = localStorage.getItem('api_token');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/auth/validate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.valid && data.user) {
          this.authStore.save(token, data.user);
          return;
        }
      }
    } catch {}
    this.authStore.clear();
  }
}

const client = new ApiClient();
export default client;
