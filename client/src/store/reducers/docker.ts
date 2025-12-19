import { DockerTestResult, DockerHost } from '../../interfaces';
import { ActionType } from '../action-types';

interface DockerState {
  loading: boolean;
  error: string | null;
  services: DockerTestResult | null;
  hosts: DockerHost[];
}

const initialState: DockerState = {
  loading: false,
  error: null,
  services: null,
  hosts: [],
};

interface Action {
  type: ActionType;
  payload?: any;
}

export const dockerReducer = (
  state = initialState,
  action: Action
): DockerState => {
  switch (action.type) {
    case ActionType.testDockerLoading:
      return { ...state, loading: true, error: null };
    case ActionType.testDocker:
      return { ...state, loading: false, services: action.payload, error: null };
    case ActionType.testDockerError:
      return { ...state, loading: false, error: action.payload };
    case ActionType.fetchDockerHosts:
      return { ...state, hosts: action.payload };
    case ActionType.addDockerHost:
      return { ...state, hosts: [...state.hosts, action.payload] };
    case ActionType.updateDockerHost:
      return {
        ...state,
        hosts: state.hosts.map((h) =>
          h.id === action.payload.id ? action.payload : h
        ),
      };
    case ActionType.deleteDockerHost:
      return {
        ...state,
        hosts: state.hosts.filter((h) => h.id !== action.payload),
      };
    default:
      return state;
  }
};
