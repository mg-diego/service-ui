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

import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import { useIntl } from 'react-intl';
import OpenIcon from 'common/img/open-in-new-tab-inline.svg';
import { useEffect } from 'react';
import { referenceDictionary } from 'common/utils';
import { showModalAction } from 'controllers/modal';
import { useDispatch, useSelector } from 'react-redux';
import { userIdSelector } from 'controllers/user';
import { faqDictionary } from 'common/utils/referenceDictionary';
import { HELP_AND_SUPPORT_EVENTS } from 'analyticsEvents/helpAndSupportEvents';
import { useTracking } from 'react-tracking';
import { setFAQOpenStatusTrue } from '../../utils';
import { messages } from '../../messages';
import { LinkItem } from '../linkItem';
import styles from './FAQContent.scss';

const cx = classNames.bind(styles);

export const FAQContent = ({ onOpen, closeSidebar, closePopover }) => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();
  const userId = useSelector(userIdSelector);
  const { trackEvent } = useTracking();

  useEffect(() => {
    onOpen(true);
    setFAQOpenStatusTrue(userId);
  }, []);

  const FAQContentItems = [
    {
      linkTo: faqDictionary.configureReporting,
      message: messages.configureReporting,
    },
    {
      linkTo: faqDictionary.improvePerformance,
      message: messages.improvePerformance,
    },
    {
      linkTo: faqDictionary.configureAnalyzer,
      message: messages.configureAnalyzer,
    },
    {
      linkTo: faqDictionary.integrateJira,
      message: messages.integrateJira,
    },
    {
      linkTo: faqDictionary.configureCertificate,
      message: messages.configureCertificate,
    },
    {
      linkTo: faqDictionary.fileStorageOptions,
      message: messages.fileStorageOptions,
    },
    {
      linkTo: faqDictionary.pricingOptions,
      message: messages.pricingOptions,
    },
  ];
  const openModal = () => {
    closePopover();
    closeSidebar();
    dispatch(
      showModalAction({
        id: 'requestSupportModal',
      }),
    );
    trackEvent(HELP_AND_SUPPORT_EVENTS.CLICK_REQUEST_SUPPORT_BUTTON);
  };

  const furtherAssistanceLinks = {
    support: (
      <LinkItem
        link={faqDictionary.rpEmailRequestSupport}
        content={formatMessage(messages.supportTeam)}
        icon={OpenIcon}
        className={cx('inline-ref')}
      />
    ),
    channel: (
      <LinkItem
        link={referenceDictionary.rpSlack}
        content={formatMessage(messages.slackChannel)}
        className={cx('inline-ref')}
        icon={OpenIcon}
      />
    ),
  };

  return (
    <>
      {FAQContentItems.map((contentItem) => (
        <LinkItem
          link={contentItem.linkTo}
          content={formatMessage(contentItem.message)}
          className={cx('menu-item')}
          onClick={() => {
            closePopover();
            closeSidebar();
          }}
          key={contentItem.linkTo}
        />
      ))}
      <p className={cx('assistance')}>
        {formatMessage(messages.furtherAssistance, {
          support: () => furtherAssistanceLinks.support,
          channel: () => furtherAssistanceLinks.channel,
        })}
      </p>
      <button className={cx('menu-item', 'with-divider')} onClick={openModal}>
        {formatMessage(messages.requestService)}
      </button>
    </>
  );
};

FAQContent.propTypes = {
  onOpen: PropTypes.func.isRequired,
  closeSidebar: PropTypes.func.isRequired,
  closePopover: PropTypes.func.isRequired,
};