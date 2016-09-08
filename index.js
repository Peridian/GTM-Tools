'use strict';

var declaring = require('./src/js/declaring.js');

declaring.start(__filename.split('\\').pop())

var
    google = require('googleapis')
    , P = require('bluebird')
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
    ], query = {
        //TODO: change with consent screen?
        auth: jwtClient
        , 'start-date': '2016-09-01'
        , 'end-date': '2016-09-03'
        , metrics: metrics.join(', ')
        , dimensions: dimensions.join(', ')
    }

app.GTM.containers(jwtClient, 1).then(function (data) {
    console.log('FWE')
    console.log(data)
    console.log('FWE')
});

/* 
app.GA.events(jwtClient, 1, 0,0, query).then(function (events) {
    app.GTM.tags(jwtClient).then(function (tagsData) {
        console.log('tagsData')
        console.log(tagsData.tags[0])
        console.log('-')
        console.log(tagsData.tags[0].parameter)
        console.log('-----')
        var
            textObj = {
                event: ''
                , tag: ''
            }
            , pass = false
            , count = 0
            ;

        events.rows.forEach(function (event, i, a) {
            event.pop();
            if (event[0] != 'undefined')
                if (event[1] != 'undefined')
                    event.forEach(function (eventStr, ii, a) {
                        textObj.event = eventStr;
                        tags.forEach(function (tag, ind, ar) {
                            textObj.tag = tag.parameter[0].value

                            pass = (
                                textObj.tag.search(textObj.event) > -1
                                ||
                                tag.name.search(textObj.event) > -1
                            )

                            if (pass) {
                                count++
                                console.log('\n')
                                console.log('-----')
                                //console.log(textObj.tag)
                                console.log('-- tag end --')
                                console.log(tag.name)
                                console.log('textObj.tag: ' + textObj.tag.length)
                                console.log('textObj.event: ' + textObj.event.length)
                                console.log()
                                console.log(event)
                                console.log(eventStr)
                                //console.log(textObj.tag)
                                console.log('\n')
                            }
                        });

                    });
        });

        console.log(count + ' tags passed')

    });
});
*/

declaring.end()