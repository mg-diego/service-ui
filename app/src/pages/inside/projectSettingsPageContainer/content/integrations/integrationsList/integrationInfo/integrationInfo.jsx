/*
 * Copyright 2022 EPAM Systems
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { redirect } from 'redux-first-router';
import classNames from 'classnames/bind';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useTracking } from 'react-tracking';
import { JIRA, RALLY, EMAIL, SAUCE_LABS } from 'common/constants/pluginNames';
import {
  isAdminSelector,
  activeProjectRoleSelector,
  activeProjectSelector,
} from 'controllers/user';
import { uiExtensionIntegrationSettingsSelector } from 'controllers/plugins/uiExtensions/selectors';
import { canUpdateSettings } from 'common/utils/permissions';
import { PLUGIN_NAME_TITLES } from 'components/integrations';
import { showModalAction } from 'controllers/modal';
import {
  namedGlobalIntegrationsSelector,
  namedProjectIntegrationsSelector,
  addIntegrationAction,
  updateIntegrationAction,
  removeProjectIntegrationsByTypeAction,
} from 'controllers/plugins';
import { PROJECT_SETTINGS_TAB_PAGE, updatePagePropertiesAction } from 'controllers/pages';
import { ExtensionLoader } from 'components/extensionLoader';
import { INTEGRATIONS_SETTINGS_COMPONENTS_MAP } from 'components/integrations/settingsComponentsMap';
import { EmptyStatePage } from 'pages/inside/projectSettingsPageContainer/content/emptyStatePage';
import { PROJECT_SETTINGS_INTEGRATION } from 'analyticsEvents/projectSettingsPageEvents';
import { INTEGRATIONS } from 'common/constants/settingsTabs';
import { IntegrationHeader } from './integrationHeader';
import { AvailableIntegrations } from './availableIntegrations';
import { messages } from './messages';
import { JIRA_CLOUD, AZURE_DEVOPS } from './constats';
import styles from './integrationInfo.scss';

const cx = classNames.bind(styles);

const documentationList = {
  [JIRA]: 'https://reportportal.io/docs/Jira-Server-Integration%3Eproject-jira-server-integration',
  [RALLY]: 'https://reportportal.io/docs/Rally-Integration%3Eproject-rally-integration',
  [EMAIL]: 'https://reportportal.io/docs/E-mail-server-integration',
  [SAUCE_LABS]: 'https://reportportal.io/docs/Sauce-Labs-integration',
  [JIRA_CLOUD]:
    'https://reportportal.io/docs/Jira-Cloud-Integration%3Eproject-jira-cloud-integration',
  [AZURE_DEVOPS]: 'https://reportportal.io/docs/Azure-DevOps-BTS',
};

export const IntegrationInfo = (props) => {
  const [integrationInfo, setIntegrationInfo] = useState({});
  const [updatedParameters, setUpdatedParameters] = useState({});
  const { formatMessage } = useIntl();
  const { trackEvent } = useTracking();
  const settingsExtensions = useSelector(uiExtensionIntegrationSettingsSelector);
  const isAdmin = useSelector(isAdminSelector);
  const userProjectRole = useSelector(activeProjectRoleSelector);
  const globalIntegrations = useSelector(namedGlobalIntegrationsSelector);
  const projectIntegrations = useSelector(namedProjectIntegrationsSelector);
  const activeProject = useSelector(activeProjectSelector);
  const isAbleToClick = canUpdateSettings(isAdmin, userProjectRole);
  const dispatch = useDispatch();
  const {
    plugin: { name: pluginName, details = {} },
    plugin,
    integrationId,
  } = props;

  const availableGlobalIntegrations = globalIntegrations[pluginName] || [];
  const availableProjectIntegrations = projectIntegrations[pluginName] || [];
  const isAtLeastOneIntegrationAvailable =
    availableGlobalIntegrations.length > 0 || availableProjectIntegrations.length > 0;

  useEffect(() => {
    const integration = availableProjectIntegrations.find((value) => value.id === +integrationId);

    if (integration) {
      setIntegrationInfo(integration);
    }
  }, [integrationId, availableProjectIntegrations]);

  useEffect(() => {
    const integration = availableGlobalIntegrations.find((value) => value.id === +integrationId);

    if (integration) {
      setIntegrationInfo({ ...integration, blocked: true });
    }
  }, [integrationId, availableGlobalIntegrations]);

  const integrationSettingsExtension = settingsExtensions.find(
    (ext) => ext.pluginName === pluginName,
  );
  const IntegrationSettingsComponent =
    INTEGRATIONS_SETTINGS_COMPONENTS_MAP[pluginName] ||
    (integrationSettingsExtension && ExtensionLoader);

  const openIntegration = (integration) => {
    const { id } = integration;
    dispatch(
      updatePagePropertiesAction({
        id,
      }),
    );
    setIntegrationInfo(integration);
  };

  const addProjectIntegration = (formData, metaData) => {
    const newData = {
      enabled: true,
      integrationParameters: formData,
      name: formData.integrationName || PLUGIN_NAME_TITLES[pluginName],
    };
    trackEvent(PROJECT_SETTINGS_INTEGRATION.CLICK_CREATE_INTEGRATION_MODAL(pluginName));
    dispatch(addIntegrationAction(newData, false, pluginName, openIntegration, metaData));
  };

  const onAddProjectIntegration = () => {
    const pluginDetails = { ...details };
    dispatch(
      showModalAction({
        id: 'createProjectIntegrationModal',
        data: {
          modalTitle: formatMessage(messages.projectIntegrationCreate),
          hasWarningMessage: Boolean(
            availableGlobalIntegrations.length && availableProjectIntegrations.length === 0,
          ),
          instanceType: pluginName,
          onConfirm: addProjectIntegration,
          customProps: {
            pluginDetails,
          },
        },
      }),
    );
    trackEvent(PROJECT_SETTINGS_INTEGRATION.CLICK_ADD_PROJECT_INTEGRATION(pluginName));
  };
  const onUpdate = (formData, onConfirm, metaData) => {
    const newData = {
      enabled: true,
      integrationParameters: formData,
    };

    if (formData.integrationName) {
      newData.name = formData.integrationName;
    }

    dispatch(
      updateIntegrationAction(
        newData,
        false,
        integrationInfo.id,
        integrationInfo.name,
        (normalizedData) => {
          setUpdatedParameters(normalizedData);
          onConfirm();
        },
        metaData,
      ),
    );
  };

  const updatedData = {
    ...integrationInfo,
    name: updatedParameters.name || integrationInfo.name,
    integrationParameters: {
      ...integrationInfo.integrationParameters,
      ...updatedParameters.integrationParameters,
    },
  };
  const allIntegrationListLink = {
    type: PROJECT_SETTINGS_TAB_PAGE,
    payload: { projectId: activeProject, settingsTab: INTEGRATIONS },
  };
  const pluginIntegrationListLink = {
    ...allIntegrationListLink,
    meta: {
      query: {
        subPage: pluginName,
      },
    },
  };

  const integrationListBreadcrumbs = [
    {
      id: 'backToIntegrations',
      title: formatMessage(messages.backToIntegration),
      link: allIntegrationListLink,
    },
  ];
  const integrationBreadcrumbs = [
    {
      id: 'integrationList',
      title: formatMessage(messages.integrationList),
      link: allIntegrationListLink,
    },
    {
      id: pluginName,
      title: `${PLUGIN_NAME_TITLES[pluginName] || pluginName} ${formatMessage(messages.settings)}`,
      link: pluginIntegrationListLink,
    },
    {
      id: updatedData.id,
      title: updatedData.name,
      link: {
        ...pluginIntegrationListLink,
        meta: {
          query: {
            subPage: pluginName,
            id: integrationId,
          },
        },
      },
    },
  ];

  const goToPluginIntegrationList = () => {
    dispatch(redirect(pluginIntegrationListLink));
  };

  const resetProjectIntegrations = () =>
    dispatch(removeProjectIntegrationsByTypeAction(pluginName));

  const onResetProjectIntegration = () => {
    dispatch(
      showModalAction({
        id: 'deleteProjectIntegrationModal',
        data: {
          onConfirm: resetProjectIntegrations,
          modalTitle: formatMessage(messages.projectIntegrationReset),
          description: formatMessage(messages.projectIntegrationResetDescription),
          isReset: true,
        },
      }),
    );
    trackEvent(PROJECT_SETTINGS_INTEGRATION.CLICK_RESET_TO_GLOBAL_INTEGRATION);
  };

  const handleDocumentationClick = () => {
    trackEvent(PROJECT_SETTINGS_INTEGRATION.CLICK_DOCUMENTATION_BUTTON('integrations'));
  };

  const renderIntegrationList = () => (
    <>
      {isAtLeastOneIntegrationAvailable ? (
        <>
          {availableProjectIntegrations.length > 0 && (
            <AvailableIntegrations
              header={formatMessage(messages.projectIntegrationTitle)}
              text={formatMessage(messages.projectIntegrationText)}
              integrations={availableProjectIntegrations}
              openIntegration={openIntegration}
            />
          )}
          <AvailableIntegrations
            header={formatMessage(messages.globalIntegrationTitle)}
            text={formatMessage(messages.globalIntegrationText)}
            integrations={availableGlobalIntegrations}
            openIntegration={openIntegration}
            hasProjectIntegration={Boolean(availableProjectIntegrations.length)}
          />
        </>
      ) : (
        <EmptyStatePage
          title={formatMessage(messages.noGlobalIntegrationsMessage)}
          handleButton={onAddProjectIntegration}
          description={formatMessage(messages.noGlobalIntegrationsDescription)}
          handleDocumentationClick={handleDocumentationClick}
          buttonName={formatMessage(messages.noGlobalIntegrationsButtonAdd)}
          disableButton={!isAbleToClick}
          documentationLink={documentationList[pluginName]}
        />
      )}
    </>
  );
  return (
    <>
      {!integrationId ? (
        <>
          <IntegrationHeader
            data={plugin}
            onAddProjectIntegration={onAddProjectIntegration}
            onResetProjectIntegration={onResetProjectIntegration}
            isAbleToClick={isAbleToClick}
            availableProjectIntegrations={availableProjectIntegrations}
            withButton={isAtLeastOneIntegrationAvailable}
            breadcrumbs={integrationListBreadcrumbs}
          />
          {renderIntegrationList()}
        </>
      ) : (
        <>
          <IntegrationHeader data={plugin} breadcrumbs={integrationBreadcrumbs} />
          <div className={cx('integration-settings-block')}>
            <IntegrationSettingsComponent
              data={updatedData}
              onUpdate={onUpdate}
              goToPreviousPage={goToPluginIntegrationList}
              extension={integrationSettingsExtension}
              withPreloader
            />
          </div>
        </>
      )}
    </>
  );
};
IntegrationInfo.propTypes = {
  plugin: PropTypes.shape({
    creationDate: PropTypes.number,
    enabled: PropTypes.bool,
    groupType: PropTypes.string,
    name: PropTypes.string,
    type: PropTypes.number,
    details: PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      version: PropTypes.string,
      resources: PropTypes.string,
    }),
  }).isRequired,
  integrationId: PropTypes.string,
};
IntegrationInfo.defaultProps = {
  integrationId: '',
};