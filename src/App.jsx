import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, Users, PieChart, PlusCircle, History } from 'lucide-react';

// Composants de pages (Mocks pour l'instant)
const Dashboard = () => (
  <div className="main-content">
    <h2>Tableau de bord</h2>
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-value">120</div>
        <div className="stat-label">Membres Actifs</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">450$</div>
        <div className="stat-label">Recettes du jour</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">12</div>
        <div className="stat-label">En retard</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">85%</div>
        <div className="stat-label">Taux paiement</div>
      </div>
    </div>
    
    <div className="card mt-4">
      <h3>Dernières activités</h3>
      <div className="list-item">
        <div>
          <strong>Jean Dupont</strong>
          <p>Parking A - Moto 1234</p>
        </div>
        <span className="badge badge-success">Payé</span>
      </div>
      <div className="list-item">
        <div>
          <strong>Marc Olivier</strong>
          <p>Parking B - Moto 5678</p>
        </div>
        <span className="badge badge-danger">Retard</span>
      </div>
    </div>
  </div>
);

const Encaisser = () => (
  <div className="main-content">
    <h2>Nouvel Encaissement</h2>
    <p>Enregistrement rapide d'un paiement journalier.</p>
    
    <div className="card">
      <div className="input-group">
        <label>Sélectionner un membre (ID ou Nom)</label>
        <input type="text" className="input" placeholder="Ex: Jean Dupont ou ID-001" />
      </div>
      
      <div className="input-group">
        <label>Montant (FC/USD)</label>
        <input type="number" className="input" defaultValue="1000" />
      </div>
      
      <button className="btn btn-success" style={{marginTop: '1rem'}}>
        <PlusCircle size={24} />
        Valider le Paiement
      </button>
    </div>
  </div>
);

const Membres = () => (
  <div className="main-content">
    <h2>Liste des Membres</h2>
    
    <div className="card">
      <div className="input-group">
        <input type="text" className="input" placeholder="Rechercher un membre..." />
      </div>
      
      <div className="list-item">
        <div>
          <strong>ID-001 • Jean Dupont</strong>
          <p>Moto: 1234AB | Parking: Central</p>
        </div>
        <span className="badge badge-success">Actif</span>
      </div>
      <div className="list-item">
        <div>
          <strong>ID-002 • Paul Kabeya</strong>
          <p>Moto: 9876XY | Parking: Nord</p>
        </div>
        <span className="badge badge-warning">Suspendu</span>
      </div>
    </div>
  </div>
);

// Navigation
const Navigation = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="bottom-nav">
      <Link to="/" className={`nav-item ${isActive('/')}`}>
        <Home size={24} />
        <span>Accueil</span>
      </Link>
      <Link to="/encaisser" className={`nav-item ${isActive('/encaisser')}`}>
        <PlusCircle size={24} />
        <span>Encaisser</span>
      </Link>
      <Link to="/membres" className={`nav-item ${isActive('/membres')}`}>
        <Users size={24} />
        <span>Membres</span>
      </Link>
    </nav>
  );
};

function App() {
  return (
    <Router>
      <div className="app-container">
        <header className="header">
          <h1>Alika Mobility</h1>
          <p>Gestion Terrain & Taximotos</p>
        </header>

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/encaisser" element={<Encaisser />} />
          <Route path="/membres" element={<Membres />} />
        </Routes>

        <Navigation />
      </div>
    </Router>
  );
}

export default App;
