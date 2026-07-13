export const AGENT_TYPES = {
  FIELD_COLLECTOR: 'field_collector',
  OFFICE_COLLECTOR: 'office_collector',
};

export const AGENT_TYPE_LABELS = {
  [AGENT_TYPES.FIELD_COLLECTOR]: 'Récupérateur terrain',
  [AGENT_TYPES.OFFICE_COLLECTOR]: 'Récolteur bureau',
};

export const getAgentType = (user) => user?.agent_type || AGENT_TYPES.FIELD_COLLECTOR;

export const isFieldCollector = (user) => getAgentType(user) === AGENT_TYPES.FIELD_COLLECTOR;

export const isOfficeCollector = (user) => getAgentType(user) === AGENT_TYPES.OFFICE_COLLECTOR;
