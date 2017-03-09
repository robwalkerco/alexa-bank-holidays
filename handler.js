'use strict';

const moment = require('moment')
const request = require('request-promise')
const takeRightWhile = require('lodash').takeRightWhile

const getDivisionName = (region) => {
  switch (region) {
    case 'northern ireland':
      return 'northern-ireland'

    case 'scotland':
      return 'scotland'

    default:
      return 'england-and-wales'
  }
}

const getEvents = (region) =>
  request('https://www.gov.uk/bank-holidays.json')
  .then(results => JSON.parse(results))
  .then(results => results[getDivisionName(region)].events)

const getUpcoming = (events) =>
  takeRightWhile(events, event =>
    moment().isBefore(event.date)
  )

module.exports = {
  'AMAZON.HelpIntent': (event, context, callback) => {
    const response = {
      version: '1.0',
      response: {
        outputSpeech: {
          type: 'PlainText',
          text: 'Some help info here',
        },
        shouldEndSession: false,
      },
    }

    callback(null, response)
  },
  GetBankHolidays: (event, context, callback) => {
    const region = (event.request.intent.slots.Region.value || 'england').toLowerCase()
    const availableRegions = [
      'england',
      'wales',
      'scotland',
      'northern ireland',
    ]

    if (availableRegions.indexOf(region) > -1) {
      getEvents(region)
      .then(events => {
        const upComing = getUpcoming(events)

        callback(
          null,
          {
            version: '1.0',
            response: {
              outputSpeech: {
                type: 'PlainText',
                text: `The next bank holiday in ${region} is ${upComing[0].title} on ${moment(upComing[0].date).format('dddd Do MMMM')}, followed by ${upComing[1].title} on ${moment(upComing[1].date).format('dddd Do MMMM')}`,
              },
              shouldEndSession: true,
            },
          }
        )
      })
      .catch(error =>
        callback(error)
      )
    }
    else {
      callback(
        null,
        {
          version: '1.0',
          response: {
            outputSpeech: {
              type: 'PlainText',
              text: `Sorry, bank holidays for ${region} are not yet supported. Try England, Wales, Scotland or Northern Ireland.`,
            },
            shouldEndSession: true,
          },
        }
      )
    }
  },
}
