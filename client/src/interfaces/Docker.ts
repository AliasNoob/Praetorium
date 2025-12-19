export interface DockerPort {
  private: number;
  public: number | null;
  type: string;
}

export interface DockerHost {
  id: string;
  name: string;
  host: string;
  enabled: boolean;
}

export interface DockerService {
  id: string;
  name: string;
  image: string;
  state: string;
  status: string;
  ports: DockerPort[];
  labels: Record<string, string>;
  suggestedUrl: string;
  suggestedIcon: string;
  hostId: string;
  hostName: string;
}

export interface DockerHostResult extends DockerHost {
  success: boolean;
  error: string | null;
  containerCount: number;
  services: DockerService[];
}

export interface DockerTestResult {
  hosts: DockerHostResult[];
  totalContainers: number;
  allServices: DockerService[];
}

export interface NewDockerHost {
  name: string;
  host: string;
  enabled: boolean;
}
