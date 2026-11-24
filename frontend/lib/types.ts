export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Portfolio {
  id: number;
  name: string;
  client_name: string;
  base_currency: "KES" | "USD";
  transactions_count?: number;
  created_at: string;
}

export interface Transaction {
  id: number;
  portfolio_id: number;
  instrument: string;
  type: "BUY" | "SELL";
  quantity: number;
  unit_price: number;
  trade_date: string;
}

export interface HoldingItem {
  instrument: string;
  net_quantity: number;
  average_cost: number;
  latest_price: number;
  total_invested: number;
  total_value: number;
  unrealized_pnl: number;
}

export interface PortfolioSummary {
  portfolio_id: number;
  base_currency: "KES" | "USD";
  totals: {
    total_invested: number;
    total_value: number;
    unrealized_pnl: number;
  };
  holdings: HoldingItem[];
}