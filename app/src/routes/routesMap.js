/*
 * Copyright 2019 EPAM Systems
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

import { redirect, actionToPath } from 'redux-first-router';
import qs from 'qs';
import {
  activeProjectSelector,
  userInfoSelector,
  setActiveProjectAction,
  setActiveProjectKeyAction,
  activeProjectKeySelector,
  createUserAssignedSelector,
} from 'controllers/user';
import { fetchProjectAction } from 'controllers/project';
import {
  LOGIN_PAGE,
  REGISTRATION_PAGE,
  PROJECT_DASHBOARD_PAGE,
  PROJECT_PAGE,
  PROJECT_DASHBOARD_ITEM_PAGE,
  PROJECT_DASHBOARD_PRINT_PAGE,
  PROJECT_SETTINGS_TAB_PAGE,
  PROJECT_LOG_PAGE,
  PROJECT_USERDEBUG_LOG_PAGE,
  PROJECT_USERDEBUG_PAGE,
  HISTORY_PAGE,
  UNIQUE_ERRORS_PAGE,
  PROJECTS_PAGE,
  PROJECT_DETAILS_PAGE,
  ALL_USERS_PAGE,
  SERVER_SETTINGS_PAGE,
  SERVER_SETTINGS_TAB_PAGE,
  LAUNCHES_PAGE,
  PROJECT_LAUNCHES_PAGE,
  PLUGINS_PAGE,
  PLUGINS_TAB_PAGE,
  NOT_FOUND,
  OAUTH_SUCCESS,
  HOME_PAGE,
  TEST_ITEM_PAGE,
  pageSelector,
  clearPageStateAction,
  adminPageNames,
  PLUGIN_UI_EXTENSION_ADMIN_PAGE,
  USER_PROFILE_SUB_PAGE,
  ACCOUNT_REMOVED_PAGE,
  PROJECT_PLUGIN_PAGE,
} from 'controllers/pages';
import { GENERAL, AUTHORIZATION_CONFIGURATION, ANALYTICS } from 'common/constants/settingsTabs';
import { INSTALLED, STORE } from 'common/constants/pluginsTabs';
import { MEMBERS, MONITORING } from 'common/constants/projectSections';
import { ANONYMOUS_REDIRECT_PATH_STORAGE_KEY, isAuthorizedSelector } from 'controllers/auth';
import {
  fetchDashboardsAction,
  fetchDashboardAction,
  changeVisibilityTypeAction,
} from 'controllers/dashboard';
import {
  fetchLaunchesAction,
  setDebugMode,
  unselectAllLaunchesAction,
  launchDistinctSelector,
} from 'controllers/launch';
import { fetchPluginsAction, fetchGlobalIntegrationsAction } from 'controllers/plugins';
import { fetchTestItemsAction, setLevelAction } from 'controllers/testItem';
import { fetchFiltersPageAction } from 'controllers/filter';
import { fetchMembersAction } from 'controllers/members';
import { fetchProjectDataAction } from 'controllers/administrate';
import { fetchAllUsersAction } from 'controllers/administrate/allUsers/actionCreators';
import { fetchLogPageData } from 'controllers/log';
import { fetchHistoryPageInfoAction } from 'controllers/itemsHistory';
import { fetchProjectsAction } from 'controllers/administrate/projects';
import { fetchOrganizationsAction } from 'controllers/organizations';
import { startSetViewMode } from 'controllers/administrate/projects/actionCreators';
import { SIZE_KEY } from 'controllers/pagination';
import { setSessionItem, updateStorageItem } from 'common/utils/storageUtils';
import { fetchClustersAction } from 'controllers/uniqueErrors';
import {
  API_KEYS_ROUTE,
  CONFIG_EXAMPLES_ROUTE,
  PROJECT_ASSIGNMENT_ROUTE,
} from 'common/constants/userProfileRoutes';
import { parseQueryToFilterEntityAction } from 'controllers/filter/actionCreators';
import {
  ORGANIZATION_PROJECTS_PAGE,
  ORGANIZATION_MEMBERS_PAGE,
  ORGANIZATION_SETTINGS_PAGE,
} from 'controllers/pages/constants';
import { prepareActiveOrganizationProjectsAction } from 'controllers/organizations/organization/actionCreators';
import { pageRendering, ANONYMOUS_ACCESS, ADMIN_ACCESS } from './constants';

const redirectRoute = (path, createNewAction, onRedirect = () => {}) => ({
  path,
  thunk: (dispatch, getState) => {
    const { location } = getState();
    const newAction = createNewAction(location.payload, getState);
    onRedirect(dispatch);
    dispatch(redirect(newAction));
  },
});

const routesMap = {
  [HOME_PAGE]: redirectRoute('/', (payload) => ({ type: LOGIN_PAGE, payload })),

  [LOGIN_PAGE]: '/login',
  [ACCOUNT_REMOVED_PAGE]: '/accountRemoved',
  [REGISTRATION_PAGE]: '/registration',
  [OAUTH_SUCCESS]: '/authSuccess',
  [NOT_FOUND]: '/notfound',

  ADMINISTRATE_PAGE: redirectRoute('/administrate', () => ({ type: PROJECTS_PAGE })),
  USER_PROFILE_PAGE: redirectRoute('/userProfile', () => ({
    type: USER_PROFILE_SUB_PAGE,
    payload: { profileRoute: PROJECT_ASSIGNMENT_ROUTE },
  })),

  [USER_PROFILE_SUB_PAGE]: `/userProfile/:profileRoute(${PROJECT_ASSIGNMENT_ROUTE}|${API_KEYS_ROUTE}|${CONFIG_EXAMPLES_ROUTE})`,

  API_PAGE: '/api',

  [PROJECTS_PAGE]: {
    path: '/administrate/projects',
    thunk: (dispatch) => {
      dispatch(fetchProjectsAction());
      dispatch(fetchOrganizationsAction());
      dispatch(startSetViewMode());
    },
  },
  [PROJECT_DETAILS_PAGE]: {
    // TODO: All administrate pages it will be changed accordingly, f.e '/administrate/users' => '/users'
    path: `/administrate/projects/organizations/:organizationSlug?/projects/:projectSlug/:projectSection(${MEMBERS}|${MONITORING})?`,
    thunk: (dispatch) => {
      dispatch(fetchProjectDataAction());
    },
  },
  [ALL_USERS_PAGE]: {
    path: '/administrate/users',
    thunk: (dispatch) => dispatch(fetchAllUsersAction()),
  },
  [SERVER_SETTINGS_PAGE]: redirectRoute('/administrate/settings', () => ({
    type: SERVER_SETTINGS_TAB_PAGE,
    payload: { settingsTab: AUTHORIZATION_CONFIGURATION },
  })),
  [SERVER_SETTINGS_TAB_PAGE]: `/administrate/settings/:settingsTab(${AUTHORIZATION_CONFIGURATION}|${ANALYTICS})`,
  [PLUGINS_PAGE]: redirectRoute(
    '/administrate/plugins',
    () => ({
      type: PLUGINS_TAB_PAGE,
      payload: { pluginsTab: INSTALLED },
    }),
    (dispatch) => {
      dispatch(fetchPluginsAction());
      dispatch(fetchGlobalIntegrationsAction());
    },
  ),
  [PLUGINS_TAB_PAGE]: `/administrate/plugins/:pluginsTab(${INSTALLED}|${STORE})`,

  [ORGANIZATION_PROJECTS_PAGE]: {
    path: '/organizations/:organizationSlug/projects',
    thunk: (dispatch, getState) => {
      const {
        location: { payload },
      } = getState();
      dispatch(prepareActiveOrganizationProjectsAction(payload));
    },
  },

  [ORGANIZATION_MEMBERS_PAGE]: {
    path: '/organizations/:organizationSlug?/members',
  },

  [ORGANIZATION_SETTINGS_PAGE]: {
    path: '/organizations/:organizationSlug?/settings',
  },

  [PROJECT_PAGE]: {
    path: '/organizations/:organizationSlug?/projects/:projectSlug',
    thunk: (dispatch, getState) => {
      dispatch(
        redirect({
          type: PROJECT_DASHBOARD_PAGE,
          payload: activeProjectSelector(getState()),
        }),
      );
    },
  },
  [PROJECT_DASHBOARD_PAGE]: {
    path: '/organizations/:organizationSlug?/projects/:projectSlug/dashboard',
    thunk: (dispatch) => {
      dispatch(
        fetchDashboardsAction({
          [SIZE_KEY]: 300,
        }),
      );
      dispatch(changeVisibilityTypeAction());
    },
  },
  [PROJECT_DASHBOARD_ITEM_PAGE]: {
    path: '/organizations/:organizationSlug?/projects/:projectSlug/dashboard/:dashboardId',
    thunk: (dispatch) => {
      dispatch(fetchDashboardAction());
    },
  },
  [PROJECT_DASHBOARD_PRINT_PAGE]: {
    path: '/organizations/:organizationSlug?/projects/:projectSlug/dashboard/:dashboardId/print',
    thunk: (dispatch) => {
      dispatch(fetchDashboardAction());
    },
  },
  [LAUNCHES_PAGE]: redirectRoute(
    '/organizations/:organizationSlug?/projects/:projectSlug/launches',
    (payload, getState) => ({
      type: PROJECT_LAUNCHES_PAGE,
      payload: { ...payload, filterId: launchDistinctSelector(getState()) },
    }),
    (dispatch) => {
      dispatch(unselectAllLaunchesAction());
    },
  ),
  [PROJECT_LAUNCHES_PAGE]: {
    path: '/organizations/:organizationSlug?/projects/:projectSlug/launches/:filterId',
    thunk: (dispatch) => {
      dispatch(setDebugMode(false));
      dispatch(setLevelAction(''));
      dispatch(parseQueryToFilterEntityAction());
    },
  },
  [HISTORY_PAGE]: {
    path:
      '/organizations/:organizationSlug?/projects/:projectSlug/launches/:filterId/:testItemIds+/history',
    thunk: (dispatch) => {
      dispatch(fetchHistoryPageInfoAction());
    },
  },
  [UNIQUE_ERRORS_PAGE]: {
    path:
      '/organizations/:organizationSlug?/projects/:projectSlug/launches/:filterId/:testItemIds+/uniqueErrors',
    thunk: (dispatch) => {
      dispatch(fetchClustersAction());
    },
  },
  PROJECT_FILTERS_PAGE: {
    path: '/organizations/:organizationSlug?/projects/:projectSlug/filters',
    thunk: (dispatch, getState, { action }) => {
      const location = action.meta?.location || {};
      dispatch(fetchFiltersPageAction(location.kind !== 'load'));
    },
  },
  [PROJECT_LOG_PAGE]: {
    path:
      '/organizations/:organizationSlug?/projects/:projectSlug/launches/:filterId/:testItemIds+/log',
    thunk: (dispatch) => {
      dispatch(setDebugMode(false));
      dispatch(fetchLogPageData());
    },
  },
  [PROJECT_USERDEBUG_LOG_PAGE]: {
    path:
      '/organizations/:organizationSlug?/projects/:projectSlug/userdebug/:filterId/:testItemIds+/log',
    thunk: (dispatch) => {
      dispatch(setDebugMode(true));
      dispatch(fetchLogPageData());
    },
  },
  [PROJECT_USERDEBUG_PAGE]: {
    path: '/organizations/:organizationSlug?/projects/:projectSlug/userdebug/:filterId',
    thunk: (dispatch) => {
      dispatch(setDebugMode(true));
      dispatch(setLevelAction(''));
      dispatch(fetchLaunchesAction());
    },
  },
  PROJECT_USERDEBUG_TEST_ITEM_PAGE: {
    path:
      '/organizations/:organizationSlug?/projects/:projectSlug/userdebug/:filterId/:testItemIds+',
    thunk: (dispatch) => {
      dispatch(setDebugMode(true));
      dispatch(fetchTestItemsAction());
    },
  },
  PROJECT_MEMBERS_PAGE: {
    path: '/organizations/:organizationSlug?/projects/:projectSlug/members',
    thunk: (dispatch) => dispatch(fetchMembersAction()),
  },
  PROJECT_SETTINGS_PAGE: redirectRoute(
    '/organizations/:organizationSlug?/projects/:projectSlug/settings',
    (payload) => ({
      type: PROJECT_SETTINGS_TAB_PAGE,
      payload: { ...payload, settingsTab: GENERAL },
    }),
  ),
  [PROJECT_SETTINGS_TAB_PAGE]: `/organizations/:organizationSlug?/projects/:projectSlug/settings/:settingsTab/:subTab*`,
  PROJECT_SANDBOX_PAGE: '/organizations/:organizationSlug?/projects/:projectSlug/sandbox',
  [TEST_ITEM_PAGE]: {
    path:
      '/organizations/:organizationSlug?/projects/:projectSlug/launches/:filterId/:testItemIds+',
    thunk: (dispatch) => {
      dispatch(setDebugMode(false));
      dispatch(fetchTestItemsAction());
    },
  },
  [PLUGIN_UI_EXTENSION_ADMIN_PAGE]: '/administrate/plugin/:pluginPage/:pluginRoute*',
  [PROJECT_PLUGIN_PAGE]: '/:projectId/plugin/:pluginPage/:pluginRoute*',
};

export const onBeforeRouteChange = (dispatch, getState, { action }) => {
  const {
    type: nextPageType,
    payload: { organizationSlug: hashOrganizationSlug, projectSlug: hashProjectSlug },
  } = action;

  let { organizationSlug, projectSlug } = activeProjectSelector(getState());
  const hashProjectKey = activeProjectKeySelector(getState());
  const currentPageType = pageSelector(getState());
  const authorized = isAuthorizedSelector(getState());
  const userId = userInfoSelector(getState())?.userId;
  const {
    isAdmin,
    hasPermission,
    assignedProjectKey,
    assignmentNotRequired,
  } = createUserAssignedSelector(hashProjectSlug, hashOrganizationSlug)(getState());

  const isAdminNewPageType = !!adminPageNames[nextPageType];
  const isAdminCurrentPageType = !!adminPageNames[currentPageType];

  const projectKey = assignedProjectKey || (assignmentNotRequired && hashProjectKey);

  const isChangedProject =
    organizationSlug !== hashOrganizationSlug || projectSlug !== hashProjectSlug;

  if (
    hashOrganizationSlug &&
    hashProjectSlug &&
    (isChangedProject || isAdminCurrentPageType) &&
    !isAdminNewPageType
  ) {
    if (hasPermission) {
      dispatch(
        setActiveProjectAction({
          organizationSlug: hashOrganizationSlug,
          projectSlug: hashProjectSlug,
        }),
      );
      dispatch(setActiveProjectKeyAction(projectKey));
      dispatch(fetchProjectAction(projectKey));

      organizationSlug = hashOrganizationSlug;
      projectSlug = hashProjectSlug;
      // TODO: to provide redirect in case of an existing organization and a non-existing project.
    } else if (isChangedProject) {
      dispatch(
        redirect({
          ...action,
          payload: { ...action.payload, organizationSlug, projectSlug },
          meta: {},
        }),
      );
    }
  }

  if (nextPageType !== currentPageType) {
    dispatch(clearPageStateAction(currentPageType, nextPageType));
  }

  const page = pageRendering[nextPageType];
  const redirectPath = actionToPath(action, routesMap, qs);
  if (page) {
    const { access } = page;
    switch (access) {
      case ANONYMOUS_ACCESS:
        if (authorized) {
          dispatch(
            redirect({
              type: PROJECT_DASHBOARD_PAGE,
              payload: { organizationSlug, projectSlug },
            }),
          );
        }
        break;
      case ADMIN_ACCESS:
        if (authorized && !isAdmin) {
          dispatch(
            redirect({
              type: PROJECT_DASHBOARD_PAGE,
              payload: { organizationSlug, projectSlug },
            }),
          );
        } else if (!authorized) {
          setSessionItem(ANONYMOUS_REDIRECT_PATH_STORAGE_KEY, redirectPath);
          dispatch(
            redirect({
              type: LOGIN_PAGE,
            }),
          );
        } else {
          updateStorageItem(`${userId}_settings`, {
            lastPath: redirectPath,
          });
        }
        break;
      default:
        if (!authorized) {
          setSessionItem(ANONYMOUS_REDIRECT_PATH_STORAGE_KEY, redirectPath);
          dispatch(
            redirect({
              type: LOGIN_PAGE,
              meta: {
                query: { redirectPath },
              },
            }),
          );
        } else {
          updateStorageItem(`${userId}_settings`, {
            lastPath: redirectPath,
          });
        }
    }
  }
};

export default routesMap;
