import { createContext, useContext, useReducer, type ReactNode } from "react";
import type { Mission, DirectOrder } from "@/types";

interface OrdersState {
  missions: Mission[];
  directOrders: DirectOrder[];
}

type OrdersAction =
  | { type: "ADD_MISSION"; mission: Mission }
  | { type: "ADD_DIRECT_ORDER"; order: DirectOrder };

function ordersReducer(state: OrdersState, action: OrdersAction): OrdersState {
  switch (action.type) {
    case "ADD_MISSION":
      return { ...state, missions: [action.mission, ...state.missions] };
    case "ADD_DIRECT_ORDER":
      return { ...state, directOrders: [action.order, ...state.directOrders] };
    default:
      return state;
  }
}

const OrdersStateContext = createContext<OrdersState | null>(null);
const OrdersDispatchContext = createContext<React.Dispatch<OrdersAction> | null>(null);

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(ordersReducer, { missions: [], directOrders: [] });
  return (
    <OrdersStateContext.Provider value={state}>
      <OrdersDispatchContext.Provider value={dispatch}>
        {children}
      </OrdersDispatchContext.Provider>
    </OrdersStateContext.Provider>
  );
}

export function useOrders(): OrdersState {
  const ctx = useContext(OrdersStateContext);
  if (!ctx) throw new Error("useOrders must be used within OrdersProvider");
  return ctx;
}

export function useOrdersDispatch(): React.Dispatch<OrdersAction> {
  const ctx = useContext(OrdersDispatchContext);
  if (!ctx) throw new Error("useOrdersDispatch must be used within OrdersProvider");
  return ctx;
}
