import React from 'react';
import { PropTypes } from 'prop-types';
import classNames from 'classnames/bind';
import { injectIntl, defineMessages, intlShape } from 'react-intl';
import { InputCheckbox } from 'components/inputs/inputCheckbox';
import { InputDropdown } from 'components/inputs/inputDropdown';
import { FilterItem } from 'pages/inside/common/launchFiltersToolbar/filterList/filterItem';
import Parser from 'html-react-parser';
import InfoIcon from 'common/img/info-inline.svg';
import { withTooltip } from 'components/main/tooltips/tooltip';
import { TextTooltip } from 'components/main/tooltips/textTooltip';
import { SEARCH_MODES } from './../../constants';
import styles from './itemsListHeader.scss';

const cx = classNames.bind(styles);

const messages = defineMessages({
  changeSimilarItems: {
    id: 'EditDefectModal.changeSimilarItems',
    defaultMessage: 'Change Similar Items',
  },
  currentLaunchMode: {
    id: 'EditDefectModal.currentLaunchMode',
    defaultMessage: 'For the current launch ',
  },
  sameLaunchNameMode: {
    id: 'EditDefectModal.sameLaunchNameMode',
    defaultMessage: 'Launches with the same name',
  },
  filterMode: {
    id: 'EditDefectModal.filterMode',
    defaultMessage: 'For the current applied filter',
  },
  [`${SEARCH_MODES.CURRENT_LAUNCH}Tooltip`]: {
    id: 'EditDefectModal.currentLaunchTooltip',
    defaultMessage: 'Test items with similar failure reason in launch {launch}',
  },
  [`${SEARCH_MODES.FILTER}Tooltip`]: {
    id: 'EditDefectModal.filterTooltip',
    defaultMessage: 'Test items with similar failure reason in last 10 launches of Filter {filter}',
  },
  [`${SEARCH_MODES.LAUNCH_NAME}Tooltip`]: {
    id: 'EditDefectModal.launchNameTooltip',
    defaultMessage: 'Test items with similar failure reason in last 10 launches of launch {launch}',
  },
});

const InfoTooltipIcon = withTooltip({
  TooltipComponent: TextTooltip,
  data: {
    noArrow: false,
  },
})(() => <div className={cx('info', 'icon')}>{Parser(InfoIcon)}</div>);

@injectIntl
export class ItemsListHeader extends React.Component {
  static propTypes = {
    intl: intlShape.isRequired,
    allSelected: PropTypes.bool,
    searchMode: PropTypes.string,
    currentLaunch: PropTypes.object,
    currentFilter: PropTypes.object,
    onSelectAllToggle: PropTypes.func,
    onChangeSearchMode: PropTypes.func,
  };

  static defaultProps = {
    onSelectAllToggle: () => {},
    allSelected: false,
    searchMode: SEARCH_MODES.CURRENT_LAUNCH,
    currentLaunch: {},
    currentFilter: null,
    onChangeSearchMode: () => {},
  };

  getSearchModeOptions = () => {
    const {
      intl: { formatMessage },
      currentFilter,
    } = this.props;
    return [
      { value: SEARCH_MODES.CURRENT_LAUNCH, label: formatMessage(messages.currentLaunchMode) },
      { value: SEARCH_MODES.LAUNCH_NAME, label: formatMessage(messages.sameLaunchNameMode) },
      {
        value: SEARCH_MODES.FILTER,
        label: formatMessage(messages.filterMode),
        disabled: !currentFilter || currentFilter.id < 1,
      },
    ];
  };

  getTooltipContent = () => {
    const {
      intl: { formatMessage },
      searchMode,
      currentLaunch,
      currentFilter,
    } = this.props;
    switch (searchMode) {
      case SEARCH_MODES.FILTER:
        return formatMessage(messages[`${searchMode}Tooltip`], { filter: currentFilter.name });
      case SEARCH_MODES.CURRENT_LAUNCH:
        return formatMessage(messages[`${searchMode}Tooltip`], {
          launch: `${currentLaunch.name} #${currentLaunch.number}`,
        });
      case SEARCH_MODES.LAUNCH_NAME:
        return formatMessage(messages[`${searchMode}Tooltip`], { launch: currentLaunch.name });
      default:
        return '';
    }
  };

  toggleSelectAll = () => {
    this.props.onSelectAllToggle(!this.props.allSelected);
  };

  render() {
    const {
      intl,
      allSelected,
      searchMode,
      currentLaunch,
      currentFilter,
      onChangeSearchMode,
    } = this.props;
    return (
      <div className={cx('list-header')}>
        <div className={cx('search-settings')}>
          <div className={cx('select-all')}>
            <InputCheckbox value={allSelected} onChange={this.toggleSelectAll} />
          </div>
          <span className={cx('search-mode-label')}>
            {intl.formatMessage(messages.changeSimilarItems)}
          </span>
          <div className={cx('search-mode')}>
            <InputDropdown
              options={this.getSearchModeOptions()}
              value={searchMode}
              onChange={onChangeSearchMode}
            />
          </div>
          {searchMode === SEARCH_MODES.CURRENT_LAUNCH && (
            <div className={cx('launch')}>{`${currentLaunch.name} #${currentLaunch.number}`}</div>
          )}
          {searchMode === SEARCH_MODES.FILTER && (
            <div className={cx('filter')}>
              <FilterItem
                name={currentFilter.name}
                description={currentFilter.description}
                owner={currentFilter.owner}
                intl={intl}
                share={currentFilter.share}
                className={cx('filter-item')}
              />
            </div>
          )}
        </div>
        <InfoTooltipIcon tooltipContent={this.getTooltipContent()} />
      </div>
    );
  }
}