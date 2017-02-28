import React from 'react';
import debounce from 'throttle-debounce/debounce';

import { PropTypes, Component } from '../../../libs';
import { getRangeHours } from '../utils'
import { Scrollbar } from '../../scrollbar';

function withIndex(arr) {
  return arr.map((e, i) => (e, i))
}

function range(end) {
  let r = []
  for (let i = 0; i < end; i++) {
    r.push(i)
  }
  return r
}

const isNumber = (value) => (typeof value === 'number')
const validateHour = (value) => (isNumber(value) && value >= 0 && value <= 23)
const validateMinOrSec = (value) => (isNumber(value) && value >= 0 && value <= 59)

function propsToState(props) {
  const {hours, minutes, seconds, selectableRange} = props
  const state = {}
  const setOnValid = (isValid, cb) => isValid && cb(state)
  setOnValid(validateHour(hours), (state) => state.hours = hours)
  setOnValid(validateMinOrSec(minutes), (state) => state.minutes = minutes)
  setOnValid(validateMinOrSec(seconds), (state) => state.seconds = seconds)
  state.hoursList = getRangeHours(selectableRange)
  state.minutesLisit = withIndex(range(60))
  state.secondsList = withIndex(range(60))
  return state
}

const SCROLL_AJUST_VALUE = 85;
export default class TimeSpinner extends Component {
  static get propTypes() {
    return {
      hours: PropTypes.number,
      minutes: PropTypes.number,
      seconds: PropTypes.number,
      isShowSeconds: PropTypes.bool,
      //[[datefrom, dateend]...]
      selectableRange: PropTypes.arrayOf(PropTypes.arrayOf(React.PropTypes.instanceOf(Date))).isRequired,
      /*
      type: one of [hours, minutes, seconds]

      onChange: ({type})=>()
      */
      onChange: PropTypes.func.isRequired,
      onSelectRangeChange: PropTypes.func.isRequired
    }

  }

  static get defaultProps() {
    return {
      hours: 0,
      minutes: 0,
      seconds: 0,
      isShowSeconds: true
    }
  }

  constructor(props) {
    super(props)

    this.state = {
      hours: 0,
      minutes: 0,
      seconds: 0,
    }

    Object.assign(this.state, propsToState(props))
    this.ajustScrollTop = this._ajustScrollTop.bind(this)
    this.handleScroll = debounce(20, this._handleScroll.bind(this))
  }

  componentDidMount() {
    this.ajustScrollTop(this.state)
  }

  componentWillReceiveProps(nextProps) {
    this.setState(propsToState(nextProps), () => {
      this.ajustScrollTop(this.state)
    })
  }

  emitSelectRange(type) {
    const {onSelectRangeChange} = this.props
    if (type === 'hours') {
      onSelectRangeChange(0, 3)
    } else if (type === 'minutes') {
      onSelectRangeChange(3, 5)
    } else if (type === 'seconds') {
      onSelectRangeChange(6, 9)
    }
  }

  _handleScroll(type) {
    const value = Math.min(Math.floor((this.refs[type].refs.wrap.scrollTop - SCROLL_AJUST_VALUE) / 32 + 3), 59);
    this.handleChange(type, value)
  }

  // type: hours, minutes, seconds
  handleChange(type, value, disabled) {
    if (disabled) return
    this.state[type] = value
    const changed = {}
    changed[type] = value
    this.setState({}, () => {
      this.ajustScrollTop(this.state)
    })
    this.props.onChange(changed)
  }

  _ajustScrollTop({hours, minutes, seconds}) {
    if (hours != null) {
      this.refs.hours.refs.wrap.scrollTop = Math.max(0, (hours - 2.5) * 32 + SCROLL_AJUST_VALUE);
    }
    if (minutes != null) {
      this.refs.minutes.refs.wrap.scrollTop = Math.max(0, (minutes - 2.5) * 32 + SCROLL_AJUST_VALUE);
    }
    if (seconds != null) {
      this.refs.seconds.refs.wrap.scrollTop = Math.max(0, (seconds - 2.5) * 32 + SCROLL_AJUST_VALUE);
    }
  }

  render() {
    const {hoursList, minutesLisit, secondsList, hours, minutes, seconds} = this.state
    const {isShowSeconds} = this.props

    return (
      <div className={this.classNames('el-time-spinner', { 'has-seconds': isShowSeconds })}>
        <Scrollbar
          onMouseEnter={() => this.emitSelectRange('hours')}
          onWheel={() => {
            this.handleScroll('hours')
          } }
          ref="hours"
          className="el-time-spinner__wrapper"
          wrapStyle={{ maxHeight: 'inherit' }}
          viewClass="el-time-spinner__list"
          viewComponent="ul"
          >
          {
            hoursList.map((disabled, idx) => {

              return (
                <li
                  key={idx}
                  onClick={() => this.handleChange('hours', idx, disabled)}
                  className={this.classNames('el-time-spinner__item', {
                    'active': idx === hours,
                    'disabled': disabled
                  })}
                  >{idx}</li>)
            })
          }
        </Scrollbar>
        <Scrollbar
          onMouseEnter={() => this.emitSelectRange('minutes')}
          onWheel={() => this.handleScroll('minutes')}
          ref="minutes"
          className="el-time-spinner__wrapper"
          wrapStyle={{ maxHeight: 'inherit' }}
          viewClass="el-time-spinner__list"
          viewComponent="ul"
          >
          {
            minutesLisit.map((disabled, idx) => {
              return (
                <li
                  key={idx}
                  onClick={() => this.handleChange('minutes', idx)}
                  className={this.classNames('el-time-spinner__item', {
                    'active': idx === minutes,
                  })}
                  >{idx}</li>
              )
            })
          }
        </Scrollbar>
        {
          isShowSeconds && (
            <Scrollbar
              onMouseEnter={() => this.emitSelectRange('seconds')}
              onWheel={() => this.handleScroll('seconds')}
              ref="seconds"
              className="el-time-spinner__wrapper"
              wrapStyle={{ maxHeight: 'inherit' }}
              viewClass="el-time-spinner__list"
              viewComponent="ul"
              >
              <ul className="el-time-spinner__list">
                {
                  secondsList.map((disabled, idx) => {
                    return (
                      <li
                        key={idx}
                        onClick={() => this.handleChange('seconds', idx)}
                        className={this.classNames('el-time-spinner__item', {
                          'active': idx === seconds,
                        })}
                        >{idx}</li>
                    )
                  })
                }
              </ul>
            </Scrollbar>
          )
        }
      </div>
    );
  }
}
