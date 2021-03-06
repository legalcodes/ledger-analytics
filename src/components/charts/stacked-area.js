import React, { Component } from 'react'
import { frenchPallate } from './colors'
import ReactEcharts from 'echarts-for-react'

export default class StackedArea extends Component {
  shouldComponentUpdate = (nextProps, nextState) => {
    return (
      !nextProps.isTyping &&
      nextProps.stackedAreaData !== this.props.stackedAreaData &&
      nextProps.stackedAreaAccounts !== this.props.stackedAreaAccounts
    )
  }

  render () {
    // Reusing data from scatter plots (just xforming them more)
    const { baseCommodity, stackedAreaAccounts, stackedAreaData, fetchStackedAreaError } = this.props

    // If scatter fetch has an error, its likely
    // because of multiple commodities
    if (fetchStackedAreaError !== undefined) {
      return (
        <div style={{textAlign: 'center', width: '100%'}}>
          Unable to fetch stacked area chart data (try changing your base currency/commodity)
        </div>
      )
    }

    if (stackedAreaAccounts.length === 0 || stackedAreaAccounts.length === 0) {
      return (
        <div style={{textAlign: 'center', width: '100%'}}>
          Insufficient data to construct stacked area
        </div>
      )
    }

    // Growth data is in format
    /*
    [
      { growth: {2018/02: 400, 2018/03: 500} },
      { growth: {2018/03: 500} }
    ]

    Want

    [
      [400, 500]
      [0, 500]
    ]
    */

    // Need to fill in empty dates
    // Start by finding all dates
    const allDates = stackedAreaData.reduce((acc, x) => {
      // In-place mutation. Ugh
      Object.keys(x.growth).map(k => {
        acc[k] = 0
        return 0
      })

      return acc
    }, {})

    // Fill in empty dates
    const stackedDataFixed = stackedAreaData.map(x => {
      return Object.keys(allDates).reduce((acc, k) => {
        acc[k] = x.growth[k] || allDates[k]
        return acc
      }, {})
    })

    // Convert to series data
    const dateSorted = Object.keys(allDates).sort()
    const stackedSeriesData = stackedDataFixed.map((x, idx) => {
      return {
        name: stackedAreaAccounts[idx],
        type: 'line',
        stack: '总量',
        areaStyle: {normal: {}},
        data: dateSorted.map(y => stackedDataFixed[idx][y].toFixed(2))
      }
    })

    const option = {
      color: frenchPallate,
      title: {
        text: 'Account Growth'
      },
      tooltip: {
        position: (point, params, dom, rect, size) => {
          return [point[0], '50%']
        },
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#000'
          }
        },
        formatter: (params, ticket, callback) => {
          const total = params.reduce((acc, current) => {
            return acc + parseFloat(current.value)
          }, 0)

          const output = params.reduce((acc, current, idx) => {
            if (idx === 0) {
              acc = acc + current.axisValue + ': ' + baseCommodity + total.toFixed(2) + '<br />'
            }
            acc = acc + current.marker + ' ' + current.seriesName + ': ' + baseCommodity + current.data + '<br />'
            return acc
          }, '')

          return output
        }
      },
      legend: {
        data: stackedAreaAccounts
      },
      toolbox: {
        feature: {
          saveAsImage: {}
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: [
        {
          type: 'category',
          boundaryGap: false,
          data: dateSorted
        }
      ],
      yAxis: [
        {
          name: 'Value (' + baseCommodity + ')',
          type: 'value'
        }
      ],
      series: stackedSeriesData
    }

    return (
      <div style={{width: '100%', height: '100%'}}>
        <ReactEcharts
          option={option}
          notMerge
          lazyUpdate
        />
      </div>
    )
  }
}
