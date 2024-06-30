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

import { takeLatest, takeEvery, call, all, put, select, take } from 'redux-saga/effects';
import { fetch } from 'common/utils/fetch';
import { URLS } from 'common/urls';
import { showNotification, NOTIFICATION_TYPES } from 'controllers/notification';
import { MANAGER, PROJECT_MANAGER } from 'common/constants/projectRoles';
import { getStorageItem, setStorageItem } from 'common/utils/storageUtils';
import { urlOrganizationAndProjectSelector } from 'controllers/pages';
import { getLogTimeFormatFromStorage } from 'controllers/log/storageUtils';
import { ADMINISTRATOR } from 'common/constants/accountRoles';
import {
  activeOrganizationSelector,
  fetchOrganizationBySlugAction,
} from 'controllers/organizations/organization';
import { FETCH_ORGANIZATION_BY_SLUG } from 'controllers/organizations/organization/constants';
import {
  FETCH_ORGANIZATION_PROJECTS,
  fetchOrganizationProjectsAction,
  projectsSelector,
} from 'controllers/organizations/projects';
import { createFetchPredicate } from 'controllers/fetch';
import {
  assignToProjectSuccessAction,
  assignToProjectErrorAction,
  unassignFromProjectSuccessAction,
  setActiveProjectAction,
  fetchUserSuccessAction,
  fetchUserErrorAction,
  setApiKeysAction,
  addApiKeySuccessAction,
  deleteApiKeySuccessAction,
  setActiveProjectKeyAction,
  setLogTimeFormatAction,
} from './actionCreators';
import {
  ASSIGN_TO_PROJECT,
  UNASSIGN_FROM_PROJECT,
  SET_ACTIVE_PROJECT,
  ADD_API_KEY,
  FETCH_API_KEYS,
  DELETE_API_KEY,
  FETCH_USER,
  DELETE_USER_ACCOUNT,
} from './constants';
import { userIdSelector, userInfoSelector } from './selectors';

function* assignToProject({ payload: project }) {
  const userId = yield select(userIdSelector);
  const userRole = PROJECT_MANAGER;
  const data = {
    userNames: {
      [userId]: userRole,
    },
  };
  try {
    yield call(fetch, URLS.userInviteInternal(project.projectKey), {
      method: 'put',
      data,
    });
    yield put(
      assignToProjectSuccessAction({
        projectKey: project.projectKey,
        projectRole: userRole,
        entryType: project.entryType,
      }),
    );
    yield put(
      showNotification({
        messageId: 'assignSuccess',
        type: NOTIFICATION_TYPES.SUCCESS,
      }),
    );
  } catch (err) {
    const error = err.message;
    yield put(
      assignToProjectErrorAction({
        projectKey: project.projectKey,
        projectRole: userRole,
        entryType: project.entryType,
      }),
    );
    yield put(
      showNotification({
        messageId: 'assignError',
        type: NOTIFICATION_TYPES.ERROR,
        values: { error },
      }),
    );
  }
}

function* unassignFromProject({ payload: project }) {
  const userId = yield select(userIdSelector);
  const data = {
    userNames: [userId],
  };
  try {
    yield call(fetch, URLS.userUnassign(project), {
      method: 'put',
      data,
    });
    yield put(unassignFromProjectSuccessAction(project));
    yield put(
      showNotification({
        messageId: 'unassignSuccess',
        type: NOTIFICATION_TYPES.SUCCESS,
      }),
    );
  } catch (err) {
    const error = err.message;
    yield put(
      showNotification({
        messageId: 'unassignError',
        type: NOTIFICATION_TYPES.ERROR,
        values: { error },
      }),
    );
  }
}

function* fetchUserWorker() {
  let user;
  try {
    user = yield call(fetch, URLS.users());
    yield put(fetchUserSuccessAction(user));
  } catch (err) {
    yield put(fetchUserErrorAction());
    return;
  }
  const urlOrganizationAndProject = yield select(urlOrganizationAndProjectSelector);
  const { userId, assignedOrganizations, assignedProjects, userRole } = user;
  const userSettings = getStorageItem(`${userId}_settings`) || {};
  const savedActiveProject = urlOrganizationAndProject || userSettings?.activeProject;
  const { organizationSlug: savedOrganizationSlug, projectSlug: savedProjectSlug } =
    savedActiveProject || {};

  const defaultProject = Object.keys(assignedProjects)[0];
  const {
    projectSlug: defaultProjectSlug,
    projectKey: defaultProjectKey,
    organizationId,
  } = assignedProjects[defaultProject];
  const defaultOrganization = Object.keys(assignedOrganizations).find(
    (key) => assignedOrganizations[key].organizationId === organizationId,
  );
  const { organizationSlug: defaultOrganizationSlug } = defaultOrganization
    ? assignedOrganizations[defaultOrganization]
    : Object.keys(assignedOrganizations)[0];

  const isSavedOrganizationExist =
    savedOrganizationSlug && savedOrganizationSlug in assignedOrganizations;

  const isSavedProjectExist =
    savedProjectSlug && savedProjectSlug in assignedProjects && isSavedOrganizationExist;

  const isAdmin = userRole === ADMINISTRATOR;
  const isManager = assignedOrganizations?.[savedOrganizationSlug]?.organizationRole === MANAGER;

  let projectKey;

  if (!isSavedProjectExist && (isAdmin || (isManager && isSavedOrganizationExist))) {
    yield put(fetchOrganizationBySlugAction(savedOrganizationSlug));
    yield take(createFetchPredicate(FETCH_ORGANIZATION_BY_SLUG));
    const activeOrganization = yield select(activeOrganizationSelector);
    yield put(fetchOrganizationProjectsAction(activeOrganization.id));
    yield take(createFetchPredicate(FETCH_ORGANIZATION_PROJECTS));

    // TODO: Fetch project by slug
    const organizationProjects = yield select(projectsSelector);
    projectKey = organizationProjects?.find(({ slug }) => slug === savedProjectSlug)?.key;
  }

  const activeProject =
    isSavedProjectExist || projectKey
      ? savedActiveProject
      : { organizationSlug: defaultOrganizationSlug, projectSlug: defaultProjectSlug };

  if (!projectKey) {
    projectKey = isSavedProjectExist
      ? assignedProjects[savedProjectSlug].projectKey
      : defaultProjectKey;
  }

  yield put(setActiveProjectAction(activeProject));
  yield put(setActiveProjectKeyAction(projectKey));
  const format = getLogTimeFormatFromStorage(user.userId);
  yield put(setLogTimeFormatAction(format));
}

function* saveActiveProjectWorker({ payload: activeProject }) {
  const user = yield select(userInfoSelector);
  const currentUserSettings = getStorageItem(`${user.userId}_settings`) || {};
  setStorageItem(`${user.userId}_settings`, {
    ...currentUserSettings,
    activeProject,
  });
}

function* addApiKey({ payload = {} }) {
  const { name, successMessage, errorMessage, onSuccess } = payload;
  const user = yield select(userInfoSelector);
  try {
    const response = yield call(fetch, URLS.apiKeys(user.id), {
      method: 'post',
      data: {
        name,
      },
    });

    // eslint-disable-next-line camelcase
    const { id, created_at, api_key } = response;
    onSuccess(api_key);
    if (successMessage) {
      yield put(
        showNotification({
          message: successMessage,
          type: NOTIFICATION_TYPES.SUCCESS,
        }),
      );
    }
    yield put(addApiKeySuccessAction({ id, name, created_at }));
  } catch ({ message }) {
    const showingMessage = errorMessage || message;
    if (errorMessage) {
      yield put(
        showNotification({
          message: showingMessage,
          type: NOTIFICATION_TYPES.ERROR,
        }),
      );
    }
  }
}

function* fetchApiKeys() {
  const user = yield select(userInfoSelector);
  try {
    const response = yield call(fetch, URLS.apiKeys(user.id));
    yield put(setApiKeysAction(response.items));
  } catch ({ message }) {
    yield put(
      showNotification({
        messageId: 'fetchApiKeysError',
        type: NOTIFICATION_TYPES.ERROR,
        values: { message },
      }),
    );
  }
}

function* deleteApiKey({ payload = {} }) {
  const { apiKeyId, successMessage, errorMessage, onSuccess } = payload;
  const user = yield select(userInfoSelector);

  try {
    yield call(fetch, URLS.apiKeyById(user.id, apiKeyId), {
      method: 'delete',
    });
    onSuccess();
    if (successMessage) {
      yield put(
        showNotification({
          message: successMessage,
          type: NOTIFICATION_TYPES.SUCCESS,
        }),
      );
    }
    yield put(deleteApiKeySuccessAction(apiKeyId));
  } catch ({ message }) {
    const showingMessage = errorMessage || message;
    if (errorMessage) {
      yield put(
        showNotification({
          message: showingMessage,
          type: NOTIFICATION_TYPES.ERROR,
        }),
      );
    }
  }
}

function* deleteUserAccount({ payload = {} }) {
  const { onSuccess } = payload;
  const user = yield select(userInfoSelector);

  try {
    yield call(fetch, URLS.userInfo(user.id), {
      method: 'delete',
    });
    onSuccess();
  } catch ({ message }) {
    yield put(
      showNotification({
        message,
        type: NOTIFICATION_TYPES.ERROR,
      }),
    );
  }
}

function* watchAddApiKey() {
  yield takeEvery(ADD_API_KEY, addApiKey);
}

function* watchFetchApiKeys() {
  yield takeEvery(FETCH_API_KEYS, fetchApiKeys);
}

function* watchDeleteApiKey() {
  yield takeEvery(DELETE_API_KEY, deleteApiKey);
}

function* watchDeleteUserAccount() {
  yield takeEvery(DELETE_USER_ACCOUNT, deleteUserAccount);
}

function* watchSaveActiveProject() {
  yield takeEvery(SET_ACTIVE_PROJECT, saveActiveProjectWorker);
}

function* watchFetchUser() {
  yield takeEvery(FETCH_USER, fetchUserWorker);
}

function* watchAssignToProject() {
  yield takeLatest(ASSIGN_TO_PROJECT, assignToProject);
}

function* watchUnassignFromProject() {
  yield takeLatest(UNASSIGN_FROM_PROJECT, unassignFromProject);
}

export function* userSagas() {
  yield all([
    watchAssignToProject(),
    watchUnassignFromProject(),
    watchFetchUser(),
    watchSaveActiveProject(),
    watchAddApiKey(),
    watchFetchApiKeys(),
    watchDeleteApiKey(),
    watchDeleteUserAccount(),
  ]);
}
