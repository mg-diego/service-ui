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
import classNames from 'classnames/bind';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { ContainerWithTabs } from 'components/main/containerWithTabs';
import { activeProjectSelector, userIdSelector } from 'controllers/user';
import { PROFILE_PAGE_EVENTS } from 'components/main/analytics/events';
import styles from './configExamplesBlock.scss';
import { BlockContainerBody } from '../blockContainer';

import { TabsConfig } from './tabsConfig';

const cx = classNames.bind(styles);
const API_KEY = '<YOUR_API_KEY>';
@connect((state) => ({
  activeProject: activeProjectSelector(state),
  login: userIdSelector(state),
}))
export class ConfigExamplesBlock extends Component {
  static propTypes = {
    login: PropTypes.string,
    activeProject: PropTypes.string,
  };
  static defaultProps = {
    login: '',
    activeProject: '',
  };
  render() {
    const { activeProject, login } = this.props;
    return (
      <div className={cx('config-example-block')}>
        <BlockContainerBody>
          <div className={cx('content-container')}>
            <ContainerWithTabs
              selectTabEventInfo={PROFILE_PAGE_EVENTS.SELECT_CONFIGURATION_TAB}
              data={[
                TabsConfig.javaConfig(API_KEY, activeProject, login),
                TabsConfig.rubyConfig(API_KEY, activeProject, login),
                TabsConfig.soapUiConfig(API_KEY, activeProject, login),
                TabsConfig.dotNetConfig,
                TabsConfig.nodejsConfig(API_KEY, activeProject, login),
              ]}
            />
          </div>
        </BlockContainerBody>
      </div>
    );
  }
}
