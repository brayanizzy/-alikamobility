import React from 'react';

const METHOD_STYLES = {
  cash: 'bg-green-500/10 text-green-600 dark:text-green-400',
  mobile_money: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  bank: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  other: 'bg-muted text-muted-foreground',
};

const METHOD_LABELS = {
  cash: 'Espèces',
  mobile_money: 'Mobile Money',
  bank: 'Banque',
  other: 'Autre',
};

const PaymentMethodBadge = ({ method }) => {
  const style = METHOD_STYLES[method] || METHOD_STYLES.other;
  const label = METHOD_LABELS[method] || method;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${style}`}>
      {label}
    </span>
  );
};

export default PaymentMethodBadge;
