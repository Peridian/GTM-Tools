'use strict'

var declaring = require('./src/js/declaring.js');

declaring.start(__filename.split('\\').pop())

var
    google = require('googleapis')
    , P = require('bluebird')
    , fs = require('fs')
    , helper = require('./src/js/helper.js')
    , key =
        /* 
        require('./client_secret.json')
        */
        require('./jsonFodao.json')
    , scopes = [
        'https://www.googleapis.com/auth/analytics.readonly'
        , 'https://www.googleapis.com/auth/tagmanager.readonly'
        , 'https://www.googleapis.com/auth/tagmanager.manage.accounts'
    ]
    ;

var
    OAuth2Client = google.auth.OAuth2
    , jwtClient = new google.auth.JWT(
        key.client_email
        , null
        , key.private_key
        , scopes
        , null
    )
    ;

var
    oauth2Client = new OAuth2Client(
        key.client_id
        , key.client_secret
        , key.redirect_uris
    )
    , app = require('./src/js/app.js')
    ;

var
    metrics = ['ga:totalEvents']
    , dimensions = [
        'ga:eventCategory'
        , 'ga:eventAction'
        , 'ga:date'
    ], query = {
        //TODO: change with consent screen?
        //        auth: jwtClient
        'start-date': '2016-08-01'
        , 'end-date': '2016-08-04'
        , metrics: metrics.join(', ')
        , dimensions: dimensions.join(', ')
        , ids: ''
    }
    , retDateObj = strDate => {
        var d = strDate.split('-');
        return new Date(
            d[0]
            , d[1]
            , d[2]
        )
    }
    , dateObj = () => {
        var obj = {
            s: retDateObj(query['start-date'])
            , e: retDateObj(query['end-date'])
        };

        obj.len = ((obj.e - obj.s) / 1000 / 60 / 60 / 24);

        return obj;
    }
    , prettyMuchEverthing = (events) => {
        /*
                    (function () {
                        var
                            d1 = new Date(query['start-date'].split('-').reverse())
                            , d2 = new Date(query['end-date'].split('-').reverse())
                        console.log('GA.events --- ' + Math.ceil((d2 - d1) / 1000 / 60 / 60 / 24 / 30) + ' day period\n')
                    })()
        */

        var
            mappedEvents = events.rows
                .map(function (e, i, a) {
                    return {
                        category: e[0]
                        , action: e[1]
//                        , date: e[2]
                        //                    , totalDaysFired: 0
                        //                  , averageRecurrency: 0
                        //                , presence: 0
                    }
                })
            /*
            */
            , array = []
            , category = ''
            , action = ''
            , obj
            , pass
            ;

        mappedEvents.forEach((e, i, a) => {

            pass = (
                action != e.action
                ||
                category != e.category
            )

            if (pass) {
                category = e.category
                action = e.action
                array.push(e)
            }

        });

        console.log(array)
        //        console.log(array)

        if (false)
            fs.writeFileSync('eventsGA.json', JSON.stringify(events))
    }

if (false)
    app.GA.events(jwtClient, query, 1, 0, 0).then(prettyMuchEverthing);
else {
    console.log('---- Reading sample file')
    fs.readFile('eventsGA.json', 'utf-8', (err, data) => {
        if (err) throw err

        var events = JSON.parse(data)

        prettyMuchEverthing(events)
    })

}

declaring.end()