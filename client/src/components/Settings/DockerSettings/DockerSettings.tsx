import { useState, useEffect, ChangeEvent, FormEvent, Fragment } from 'react';

// Redux
import { useDispatch, useSelector } from 'react-redux';
import { State } from '../../../store/reducers';
import { bindActionCreators } from 'redux';
import { actionCreators } from '../../../store';

// Typescript
import {
  DockerSettingsForm,
  DockerService,
  DockerHost,
  NewDockerHost,
  DockerHostResult,
} from '../../../interfaces';

// UI
import { InputGroup, Button, SettingsHeadline } from '../../UI';

// Utils
import { inputHandler, dockerSettingsTemplate } from '../../../utility';

// CSS
import classes from './DockerSettings.module.css';

export const DockerSettings = (): JSX.Element => {
  const { loading, config } = useSelector((state: State) => state.config);
  const {
    loading: dockerLoading,
    services: dockerResult,
    error: dockerError,
    hosts: dockerHosts,
  } = useSelector((state: State) => state.docker);

  const dispatch = useDispatch();
  const {
    updateConfig,
    testDockerConnection,
    fetchDockerHosts,
    addDockerHost,
    updateDockerHost,
    deleteDockerHost,
  } = bindActionCreators(actionCreators, dispatch);

  // Form state for general settings
  const [formData, setFormData] = useState<DockerSettingsForm>(
    dockerSettingsTemplate
  );

  // State for adding/editing hosts
  const [showAddHost, setShowAddHost] = useState(false);
  const [editingHostId, setEditingHostId] = useState<string | null>(null);
  const [newHost, setNewHost] = useState<NewDockerHost>({
    name: '',
    host: '',
    enabled: true,
  });

  // Fetch Docker hosts on mount
  useEffect(() => {
    fetchDockerHosts();
  }, []);

  // Get config
  useEffect(() => {
    setFormData({
      ...config,
    });
  }, [config, loading]);

  // Form handler for general settings
  const formSubmitHandler = async (e: FormEvent) => {
    e.preventDefault();
    await updateConfig(formData);
  };

  // Input handler for general settings
  const inputChangeHandler = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    options?: { isNumber?: boolean; isBool?: boolean }
  ) => {
    inputHandler<DockerSettingsForm>({
      e,
      options,
      setStateHandler: setFormData,
      state: formData,
    });
  };

  // Test all Docker hosts
  const handleTestAllConnections = () => {
    testDockerConnection();
  };

  // Add new host
  const handleAddHost = () => {
    if (!newHost.name.trim() || !newHost.host.trim()) return;
    addDockerHost(newHost);
    setNewHost({ name: '', host: '', enabled: true });
    setShowAddHost(false);
  };

  // Start editing a host
  const handleEditHost = (host: DockerHost) => {
    setEditingHostId(host.id);
    setNewHost({ name: host.name, host: host.host, enabled: host.enabled });
  };

  // Save edited host
  const handleSaveEdit = () => {
    if (!editingHostId || !newHost.name.trim() || !newHost.host.trim()) return;
    updateDockerHost(editingHostId, newHost);
    setEditingHostId(null);
    setNewHost({ name: '', host: '', enabled: true });
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingHostId(null);
    setNewHost({ name: '', host: '', enabled: true });
  };

  // Delete a host
  const handleDeleteHost = (id: string) => {
    if (window.confirm('Are you sure you want to delete this Docker host?')) {
      deleteDockerHost(id);
    }
  };

  // Toggle host enabled
  const handleToggleEnabled = (host: DockerHost) => {
    updateDockerHost(host.id, { enabled: !host.enabled });
  };

  return (
    <Fragment>
      <form onSubmit={(e) => formSubmitHandler(e)}>
        <SettingsHeadline text="Docker Hosts" />

        {/* DOCKER HOSTS LIST */}
        <div className={classes.HostsContainer}>
          {dockerHosts.length === 0 ? (
            <p className={classes.NoHosts}>
              No Docker hosts configured. Add one below.
            </p>
          ) : (
            <div className={classes.HostsList}>
              {dockerHosts.map((host: DockerHost) => (
                <div key={host.id} className={classes.HostItem}>
                  {editingHostId === host.id ? (
                    // Edit mode
                    <div className={classes.HostEditForm}>
                      <input
                        type="text"
                        placeholder="Name (e.g., Media Server)"
                        value={newHost.name}
                        onChange={(e) =>
                          setNewHost({ ...newHost, name: e.target.value })
                        }
                      />
                      <input
                        type="text"
                        placeholder="Host (e.g., 192.168.1.100:2375)"
                        value={newHost.host}
                        onChange={(e) =>
                          setNewHost({ ...newHost, host: e.target.value })
                        }
                      />
                      <div className={classes.HostEditActions}>
                        <Button click={handleSaveEdit}>Save</Button>
                        <Button click={handleCancelEdit}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <Fragment>
                      <div className={classes.HostInfo}>
                        <span className={classes.HostName}>{host.name}</span>
                        <span className={classes.HostAddress}>{host.host}</span>
                        <span
                          className={classes.HostEnabled}
                          data-enabled={host.enabled}
                        >
                          {host.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <div className={classes.HostActions}>
                        <button
                          type="button"
                          className={classes.IconButton}
                          onClick={() => handleToggleEnabled(host)}
                          title={host.enabled ? 'Disable' : 'Enable'}
                        >
                          {host.enabled ? '⏸' : '▶'}
                        </button>
                        <button
                          type="button"
                          className={classes.IconButton}
                          onClick={() => handleEditHost(host)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className={classes.IconButton}
                          onClick={() => handleDeleteHost(host.id)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </Fragment>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ADD NEW HOST */}
          {showAddHost ? (
            <div className={classes.AddHostForm}>
              <input
                type="text"
                placeholder="Name (e.g., Local Docker, Media Server)"
                value={newHost.name}
                onChange={(e) =>
                  setNewHost({ ...newHost, name: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Host (e.g., localhost:2375, 192.168.1.100:2375)"
                value={newHost.host}
                onChange={(e) =>
                  setNewHost({ ...newHost, host: e.target.value })
                }
              />
              <div className={classes.AddHostActions}>
                <Button click={handleAddHost}>Add Host</Button>
                <Button click={() => setShowAddHost(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <Button click={() => setShowAddHost(true)}>+ Add Docker Host</Button>
          )}
        </div>

        <span className={classes.HelpNote}>
          For Docker Desktop on Windows, enable "Expose daemon on
          tcp://localhost:2375" in Settings → General. For remote Linux servers,
          configure Docker to listen on tcp://0.0.0.0:2375
        </span>

        {/* TEST ALL CONNECTIONS BUTTON */}
        <InputGroup>
          <Button click={handleTestAllConnections}>
            {dockerLoading
              ? 'Testing...'
              : 'Test All Connections & Discover Services'}
          </Button>
        </InputGroup>

        {/* DOCKER ERROR DISPLAY */}
        {dockerError && (
          <div className={classes.ErrorMessage}>
            <strong>Error:</strong> {dockerError}
          </div>
        )}

        {/* DISCOVERED SERVICES DISPLAY - GROUPED BY HOST */}
        {dockerResult && dockerResult.hosts && (
          <div className={classes.ResultsContainer}>
            <h4>
              Discovered Services ({dockerResult.totalContainers} total across{' '}
              {dockerResult.hosts.length} host(s))
            </h4>

            {dockerResult.hosts.map((hostResult: DockerHostResult) => (
              <div key={hostResult.id} className={classes.HostResultSection}>
                <div className={classes.HostResultHeader}>
                  <span className={classes.HostResultName}>
                    {hostResult.name}
                  </span>
                  <span className={classes.HostResultAddress}>
                    ({hostResult.host})
                  </span>
                  {hostResult.success ? (
                    <span className={classes.HostResultSuccess}>
                      ✓ {hostResult.containerCount} containers
                    </span>
                  ) : (
                    <span className={classes.HostResultError}>
                      ✗ {hostResult.error}
                    </span>
                  )}
                </div>

                {hostResult.success && hostResult.services.length > 0 && (
                  <div className={classes.ServicesList}>
                    {hostResult.services.map((service: DockerService) => (
                      <div key={service.id} className={classes.ServiceItem}>
                        <span className={classes.ServiceName}>
                          {service.name}
                        </span>
                        <span
                          className={classes.ServiceStatus}
                          data-state={service.state}
                        >
                          {service.status}
                        </span>
                        {service.suggestedUrl && (
                          <span className={classes.ServiceUrl}>
                            {service.suggestedUrl}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <p className={classes.InfoText}>
              These services can be used when adding a new app by selecting
              "From Docker" mode.
            </p>
          </div>
        )}

        <SettingsHeadline text="Legacy Docker Settings" />

        {/* USE DOCKER API */}
        <InputGroup>
          <label htmlFor="dockerApps">Auto-sync Docker apps (legacy)</label>
          <select
            id="dockerApps"
            name="dockerApps"
            value={formData.dockerApps ? 1 : 0}
            onChange={(e) => inputChangeHandler(e, { isBool: true })}
          >
            <option value={1}>Enabled</option>
            <option value={0}>Disabled</option>
          </select>
          <span>
            Legacy mode: automatically creates apps from containers with
            praetorium.* labels. Recommended: Disable this and use "From Docker"
            when adding apps manually.
          </span>
        </InputGroup>

        {/* UNPIN DOCKER APPS */}
        <InputGroup>
          <label htmlFor="unpinStoppedApps">
            Unpin stopped containers / other apps
          </label>
          <select
            id="unpinStoppedApps"
            name="unpinStoppedApps"
            value={formData.unpinStoppedApps ? 1 : 0}
            onChange={(e) => inputChangeHandler(e, { isBool: true })}
          >
            <option value={1}>True</option>
            <option value={0}>False</option>
          </select>
        </InputGroup>

        {/* KUBERNETES SETTINGS */}
        <SettingsHeadline text="Kubernetes" />
        {/* USE KUBERNETES */}
        <InputGroup>
          <label htmlFor="kubernetesApps">Use Kubernetes Ingress API</label>
          <select
            id="kubernetesApps"
            name="kubernetesApps"
            value={formData.kubernetesApps ? 1 : 0}
            onChange={(e) => inputChangeHandler(e, { isBool: true })}
          >
            <option value={1}>True</option>
            <option value={0}>False</option>
          </select>
        </InputGroup>

        <Button>Save changes</Button>
      </form>
    </Fragment>
  );
};