import axios from 'axios';
import { Dispatch } from 'redux';
import { ApiResponse, DockerTestResult, DockerHost, NewDockerHost } from '../../interfaces';
import { applyAuth } from '../../utility';
import { ActionType } from '../action-types';
import { CreateNotificationAction } from './notification';

export interface TestDockerAction {
  type: ActionType.testDocker;
  payload: DockerTestResult | null;
}

export interface TestDockerLoadingAction {
  type: ActionType.testDockerLoading;
}

export interface TestDockerErrorAction {
  type: ActionType.testDockerError;
  payload: string;
}

export interface FetchDockerHostsAction {
  type: ActionType.fetchDockerHosts;
  payload: DockerHost[];
}

export interface AddDockerHostAction {
  type: ActionType.addDockerHost;
  payload: DockerHost;
}

export interface UpdateDockerHostAction {
  type: ActionType.updateDockerHost;
  payload: DockerHost;
}

export interface DeleteDockerHostAction {
  type: ActionType.deleteDockerHost;
  payload: string; // id of deleted host
}

export type DockerAction =
  | TestDockerAction
  | TestDockerLoadingAction
  | TestDockerErrorAction
  | FetchDockerHostsAction
  | AddDockerHostAction
  | UpdateDockerHostAction
  | DeleteDockerHostAction;

interface DockerErrorResponse {
  success: false;
  error: string;
  data: null;
}

// Fetch all Docker hosts
export const fetchDockerHosts =
  () =>
  async (dispatch: Dispatch<FetchDockerHostsAction | CreateNotificationAction>) => {
    try {
      const res = await axios.get<ApiResponse<DockerHost[]>>('/api/docker/hosts', {
        headers: applyAuth(),
      });

      if (res.data.success) {
        dispatch({
          type: ActionType.fetchDockerHosts,
          payload: res.data.data,
        });
      }
    } catch (err: any) {
      dispatch({
        type: ActionType.createNotification,
        payload: {
          title: 'Error',
          message: 'Failed to fetch Docker hosts',
        },
      });
    }
  };

// Add a new Docker host
export const addDockerHost =
  (hostData: NewDockerHost) =>
  async (dispatch: Dispatch<AddDockerHostAction | CreateNotificationAction>) => {
    try {
      const res = await axios.post<ApiResponse<DockerHost>>('/api/docker/hosts', hostData, {
        headers: applyAuth(),
      });

      if (res.data.success) {
        dispatch({
          type: ActionType.addDockerHost,
          payload: res.data.data,
        });

        dispatch({
          type: ActionType.createNotification,
          payload: {
            title: 'Success',
            message: `Docker host "${res.data.data.name}" added`,
          },
        });
      }
    } catch (err: any) {
      dispatch({
        type: ActionType.createNotification,
        payload: {
          title: 'Error',
          message: err.response?.data?.error || 'Failed to add Docker host',
        },
      });
    }
  };

// Update a Docker host
export const updateDockerHost =
  (id: string, hostData: Partial<NewDockerHost>) =>
  async (dispatch: Dispatch<UpdateDockerHostAction | CreateNotificationAction>) => {
    try {
      const res = await axios.put<ApiResponse<DockerHost>>(
        `/api/docker/hosts/${id}`,
        hostData,
        { headers: applyAuth() }
      );

      if (res.data.success) {
        dispatch({
          type: ActionType.updateDockerHost,
          payload: res.data.data,
        });

        dispatch({
          type: ActionType.createNotification,
          payload: {
            title: 'Success',
            message: `Docker host "${res.data.data.name}" updated`,
          },
        });
      }
    } catch (err: any) {
      dispatch({
        type: ActionType.createNotification,
        payload: {
          title: 'Error',
          message: err.response?.data?.error || 'Failed to update Docker host',
        },
      });
    }
  };

// Delete a Docker host
export const deleteDockerHost =
  (id: string) =>
  async (dispatch: Dispatch<DeleteDockerHostAction | CreateNotificationAction>) => {
    try {
      const res = await axios.delete<ApiResponse<DockerHost>>(`/api/docker/hosts/${id}`, {
        headers: applyAuth(),
      });

      if (res.data.success) {
        dispatch({
          type: ActionType.deleteDockerHost,
          payload: id,
        });

        dispatch({
          type: ActionType.createNotification,
          payload: {
            title: 'Success',
            message: `Docker host "${res.data.data.name}" deleted`,
          },
        });
      }
    } catch (err: any) {
      dispatch({
        type: ActionType.createNotification,
        payload: {
          title: 'Error',
          message: err.response?.data?.error || 'Failed to delete Docker host',
        },
      });
    }
  };

// Test all Docker hosts
export const testDockerConnection =
  () =>
  async (
    dispatch: Dispatch<DockerAction | CreateNotificationAction>
  ) => {
    dispatch({ type: ActionType.testDockerLoading });

    try {
      const res = await axios.get<ApiResponse<DockerTestResult> | DockerErrorResponse>(
        '/api/docker/test',
        {
          headers: applyAuth(),
        }
      );

      if (res.data.success) {
        const data = res.data as ApiResponse<DockerTestResult>;
        dispatch({
          type: ActionType.testDocker,
          payload: data.data,
        });

        const successCount = data.data.hosts.filter((h) => h.success).length;
        const failCount = data.data.hosts.filter((h) => !h.success).length;

        let message = `Found ${data.data.totalContainers} containers`;
        if (failCount > 0) {
          message += ` (${failCount} host(s) failed to connect)`;
        }

        dispatch({
          type: ActionType.createNotification,
          payload: {
            title: successCount > 0 ? 'Success' : 'Warning',
            message,
          },
        });
      } else {
        const errorData = res.data as DockerErrorResponse;
        dispatch({
          type: ActionType.testDockerError,
          payload: errorData.error || 'Failed to connect',
        });

        dispatch({
          type: ActionType.createNotification,
          payload: {
            title: 'Error',
            message: errorData.error || 'Failed to connect to Docker',
          },
        });
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Unknown error';
      dispatch({
        type: ActionType.testDockerError,
        payload: errorMessage,
      });

      dispatch({
        type: ActionType.createNotification,
        payload: {
          title: 'Error',
          message: errorMessage,
        },
      });
    }
  };

// Test a single Docker host
export const testSingleDockerHost =
  (id: string) =>
  async (dispatch: Dispatch<CreateNotificationAction>) => {
    try {
      const res = await axios.get<ApiResponse<any> | DockerErrorResponse>(
        `/api/docker/test/${id}`,
        { headers: applyAuth() }
      );

      if (res.data.success) {
        dispatch({
          type: ActionType.createNotification,
          payload: {
            title: 'Success',
            message: `Connected! Found ${res.data.data.containerCount} containers`,
          },
        });
        return { success: true, data: res.data.data };
      } else {
        const errorData = res.data as DockerErrorResponse;
        dispatch({
          type: ActionType.createNotification,
          payload: {
            title: 'Error',
            message: errorData.error,
          },
        });
        return { success: false, error: errorData.error };
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message;
      dispatch({
        type: ActionType.createNotification,
        payload: {
          title: 'Error',
          message: errorMessage,
        },
      });
      return { success: false, error: errorMessage };
    }
  };

export const clearDockerServices =
  () => (dispatch: Dispatch<TestDockerAction>) => {
    dispatch({
      type: ActionType.testDocker,
      payload: null,
    });
  };
