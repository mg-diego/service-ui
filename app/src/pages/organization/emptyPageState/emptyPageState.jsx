/*!
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

import classNames from 'classnames/bind';
import { Button } from 'componentLibrary/button';
import PropTypes from 'prop-types';
import Parser from 'html-react-parser';
import styles from './emptyPageState.scss';

const cx = classNames.bind(styles);

export const EmptyPageState = ({
  hasPermission,
  label,
  description,
  startIcon,
  buttonTitle,
  emptyIcon,
}) => (
  <div className={cx('empty-page-state')}>
    <div className={cx('empty-icon')}>{Parser(emptyIcon)}</div>
    <div className={cx('content')}>
      <span className={cx('label')}>{label}</span>
      <p className={cx('description')}>{description}</p>
      {hasPermission && (
        <Button variant={'text'} customClassName={cx('button')} startIcon={startIcon}>
          {buttonTitle}
        </Button>
      )}
    </div>
  </div>
);

EmptyPageState.propTypes = {
  hasPermission: PropTypes.bool,
  label: PropTypes.string,
  description: PropTypes.string,
  buttonTitle: PropTypes.string,
  startIcon: PropTypes.element,
  emptyIcon: PropTypes.element.isRequired,
};

EmptyPageState.defaultProps = {
  hasPermission: false,
  label: '',
  description: '',
  buttonTitle: '',
  startIcon: null,
};
