/*
 * Copyright 2024 EPAM Systems
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

import { createQueryParametersSelector } from 'controllers/pages';
import { DEFAULT_SORT_COLUMN, SORTING_KEY } from 'controllers/organizations/projects/constants';
import { SORTING_ASC } from 'controllers/sorting';
import { organizationSelector } from '../organization/selectors';

const domainSelector = (state) => organizationSelector(state).projects || {};

export const projectsPaginationSelector = (state) => domainSelector(state).pagination;
export const projectsSelector = (state) => domainSelector(state).projects;
export const loadingSelector = (state) => domainSelector(state).loading || false;

export const querySelector = createQueryParametersSelector({
  defaultFields: [DEFAULT_SORT_COLUMN],
  defaultDirection: SORTING_ASC,
  sortingKey: SORTING_KEY,
});