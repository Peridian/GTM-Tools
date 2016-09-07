'use strict';

console.log('\n');
console.log('-----');
console.log('NOW RUNNING: ' + __filename.split('\\').pop());
console.log('-----');
console.log('\n');

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
    , app = {
        GA: {
            analytics: google.analytics('v3')
            , accounts: function (jwtClient) {
                console.log('----- GA.accounts')
                var self = this;
                return new P(function (resolve, reject) {
                    self.analytics.management.accounts.list
                        //TODO: change with consent screen?
                        ({ auth: jwtClient }
                        , function (err, res) {
                            if (err) reject(err);
                            resolve(
                                res.items.map(function (e, i) {
                                    return {
                                        //TODO: decide on result format
                                        accountId: e.id
                                        , name: e.name
                                    };
                                })
                            );
                        })
                });
            }
            , webProperties: function (jwtClient) {
                console.log('----- GA.properties');
                var self = this;
                return new P(function (resolve, reject) {
                    var accounts = self.accounts(jwtClient)
                    accounts.then(function (data) {
                        /*
                        TODO:
                        Change for interface choice
                        A gateway validation as well if user has no selected account to look at
                        */
                        var accountId = data[1].accountId;
                        self.analytics.management.webproperties.list({
                            //TODO: change with consent screen?
                            auth: jwtClient
                            , accountId: accountId
                        }
                            , function (err, res) {
                                if (err) reject(err);
                                resolve(res);
                            })
                    });
                });
            }
            , profiles: function (jwtClient) {
                console.log('----- GA.propertyViews');
                var self = this;
                return new P(function (resolve, reject) {
                    var properties = self.webProperties(jwtClient)
                    properties.then(function (data) {
                        /*
                        TODO:
                        Change for interface choice
                        A gateway validation as well if user has no selected account to look at
                        */
                        var webProperty = data.items[0];
                        self.analytics.management.profiles.list(
                            {
                                //TODO: change with consent screen?
                                auth: jwtClient
                                , accountId: webProperty.accountId
                                , webPropertyId: webProperty.id
                                ,
                            }, function (err, res) {
                                if (err) reject(err)
                                resolve(res)
                            }
                        )
                    });
                });
            }
            , events: function (jwtClient) {
                console.log('----- GA.events');
                var self = this;
                return new P(function (resolve, reject) {
                    var profiles = self.profiles(jwtClient)
                    profiles.then(function (data) {
                        /*
                        TODO:
                        Change for interface choice
                        A gateway validation as well if user has no selected account to look at
                        */
                        var
                            profile = data.items[0]
                            , metrics = ['ga:totalEvents']
                            , dimensions = [
                                'ga:eventCategory'
                                , 'ga:eventAction'
                            ]
                            , params = {
                                //TODO: change with consent screen?
                                auth: jwtClient
                                , ids: 'ga:' + profile.id
                                , 'start-date': '2016-09-01'
                                , 'end-date': '2016-09-03'
                                , metrics: metrics.join(', ')
                                , dimensions: dimensions.join(', ')
                            }
                            ;
                        self.analytics.data.ga.get(params, function (err, res) {
                            if (err) reject(err)
                            resolve(
                                res
                                /*
                                    .rows.map(function (e, i) {
                                    return {
                                        category: e[0]
                                        , action: e[1]
                                        , label: e[2]
                                    }

                                }
                        )
                                */
                            )
                        })
                    });
                });
            }
        }
        , GTM: {
            tagManager: google.tagmanager('v1')
            , accounts: function (jwtClient) {
                console.log('----- GTM.accounts')
                var self = this;
                return new P(function (resolve, reject) {
                    self.tagManager.accounts.list(
                        //TODO: change with consent screen?
                        { auth: jwtClient }
                        , function (err, response) {
                            if (err) reject(err);
                            resolve(response.accounts);
                        });
                });
            }
            , containers: function (jwtClient) {
                console.log('----- GTM.containers')
                var self = this;
                return new P(function (resolve, reject) {
                    var accounts = self.accounts(jwtClient);
                    accounts.then(function (data) {
                        /*
                        TODO:
                        Change for interface choice
                        A gateway validation as well if user has no selected account to look at
                        */
                        var id = data[1].accountId;
                        console.log('Conta: ' + data[1].name + '\n')
                        self.tagManager.accounts.containers.list(
                            {
                                //TODO: change with consent screen?
                                auth: jwtClient
                                , accountId: id
                            }
                            , function (err, response) {
                                if (err) reject(err);
                                resolve({
                                    accountId: id
                                    , data: response
                                });
                            });
                    })
                });
            }
            , tags: function (jwtClient, type) {
                console.log('----- GTM.tags')
                var self = this;
                return new P(function (resolve, reject) {
                    var containers = self.containers(jwtClient);
                    containers.then(function (data) {
                        /*
                        TODO:
                        Change for interface choice
                        A gateway validation as well if user has no selected account to look at
                        */
                        var
                            accountId = data.accountId
                            , containerNum = 1
                            , containerId = data.data.containers[containerNum].containerId;

                        console.log('Container: ' + data.data.containers[containerNum].name + '\n')

                        self.tagManager.accounts.containers.tags.list({
                            //TODO: change with consent screen?
                            auth: jwtClient
                            , accountId: accountId
                            , containerId: containerId
                        }
                            , function (err, response) {
                                if (err) reject(err);

                                resolve(response)
                                /* 
                                                                var
                                                                    array = []
                                                                    , tags = response.tags
                                                                    ;
                                
                                                                tags.forEach(function (e, i, a) {
                                                                    if (e.type == 'type')
                                                                        array.push(e);
                                                                });
                                
                                                                resolve(array);
                                */


                            });
                    });
                });
            }
        }
    }
    ;


app.GTM.accounts(jwtClient).then(function (data) {
    console.log('data')
    console.log(data)
});
/* 
app.GA.events(jwtClient).then(function (events) {
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
console.log('Execution end');
console.log('\n');