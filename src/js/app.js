'use strict';

var declaring = require('./declaring.js');

declaring.start(__filename.split('\\').pop());

var
    google = require('googleapis')
    , P = require('bluebird')
    ;

module.exports = {
    GA: {
        analytics: google.analytics('v3')
        , logs: {
            messages: {
                empty: function (data) {
                    console.log('- No ' + data.kind.split('#').pop() + ' to be found...')
                    //console.log('- This ' + elementType + ' has no ')
                }
                , entering: function (data, self) {
                    var item = data.items[0];
                    console.log('\n')
                    console.log('- Entering ' + item.kind.split('#').pop() + ' "' + item.name + '"...')
                    console.log('\n')
                }
                , kind: function (data) {
                    var kind = data.items[0].kind.split('#').pop();

                    return 'aeiou'.indexOf(kind[0].toLowerCase()) !== -1
                        ? 'n ' + kind
                        : ' ' + kind
                }
                , choose: function (data, self) {
                    var kind = data.items[0].kind.split('#').pop();

                    kind = 'aeiou'.indexOf(kind[0].toLowerCase()) !== -1
                        ? 'n ' + kind
                        : ' ' + kind

                    return console.log(
                        '\n- Please, choose a' + self.logs.messages.kind(data) + ':\n'
                        , data.items.map(function (e, i, a) {
                            return '"' + i + '" for "' + e.name + '"'
                        }).join('\n ')
                        , '\n'
                    )
                }
            }
            , data: function (data) {
                console.log('\n')
                console.log(data)
                console.log('\n')
            }
        }
        , accounts: function (jwtClient) {
            console.log('----- GA.accounts')
            var self = this;
            return new P(function (resolve, reject) {
                self.analytics.management.accounts.list
                    //TODO: change with consent screen?
                    ({ auth: jwtClient }
                    , function (err, res) {
                        if (err) reject(err);
                        resolve(res);
                    })
            });
        }
        , webProperties: function (jwtClient, accNum) {
            console.log('----- GA.webProperties');
            var self = this;
            return new P(function (resolve, reject) {
                var accounts = self.accounts(jwtClient)
                accounts.then(function (data) {

                    /*
                    TODO:
                    Change for interface choice
                    A gateway validation as well if user has no selected account to look at
                    */
                    var
                        accountId = ''
                        , pass = (
                            accNum != undefined
                            &&
                            data.items.length != 0
                            &&
                            (accNum + 1) <= data.items.length
                        )

                    if (pass)
                        accountId = data.items[accNum].id;
                    else
                        if (data.items.length == 0)
                            return self.messages.empty(data);
                        else if (data.items.length == 1) {
                            self.logs.messages.entering(data, self);
                            accountId = data.items[0].id;
                        } else return self.logs.messages.choose(data, self)

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
        , profiles: function (jwtClient, accNum, webPropNum) {
            console.log('----- GA.profiles');
            var self = this;
            return new P(function (resolve, reject) {
                var properties = self.webProperties(jwtClient, accNum)
                properties.then(function (data) {
                    var
                        accountId = ''
                        , webPropertyId = ''
                        , length = data.items.length
                        , pass = (
                            (webPropNum != undefined)
                            &&
                            data.items.length != 0
                            &&
                            (webPropNum + 1) <= data.items.length
                        )

                    if (pass) {
                        var item = data.items[webPropNum];
                        accountId = item.accountId;
                        webPropertyId = item.id;
                    } else
                        if (data.items.length == 0)
                            return self.logs.messages.empty(data);
                        else if (data.items.length == 1) {
                            self.logs.messages.entering(data, self);
                            accountId = data.items[0].accountId;
                            webPropertyId = data.items[0].id;
                        } else return self.logs.messages.choose(data, self)

                    /*
                    TODO:
                    Change for interface choice
                    A gateway validation as well if user has no selected account to look at
                        */
                    self.analytics.management.profiles.list(
                        {
                            //TODO: change with consent screen?
                            auth: jwtClient
                            , accountId: accountId
                            , webPropertyId: webPropertyId
                        }, function (err, res) {
                            if (err) reject(err)
                            resolve(res)
                        }
                    )
                });
            });
        }
        , events: function (jwtClient, accNum, webPropNum, profNum, query) {
            console.log('----- GA.events');
            var self = this;
            return new P(function (resolve, reject) {
                var profiles = self.profiles(jwtClient, accNum, webPropNum)
                profiles.then(function (data) {
                    /*
                    TODO:
                    Change for interface choice
                    A gateway validation as well if user has no selected account to look at
                    */

                    var
                        pass = (
                            profNum != undefined
                            &&
                            data.items.length >= 1
                            &&
                            (profNum + 1) <= data.items.length
                        )
                        , profile = ''
                        ;

                    if (pass) {
                        profile = data.items[profNum].id
                        query.ids = 'ga:' + profile
                    } else
                        if (data.items.length == 0)
                            return self.messages.empty(data);
                        else if (data.items.length == 1) {
                            self.messages.entering(data, self);
                            profile = data.items[0].id;

                        } else return self.messages.choose(data, self)

                    self.analytics.data.ga.get(query, function (err, res) {
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
        , logs: {
            data: function (data) {
                console.log('\n')
                console.log(data)
                console.log('\n')
            }
            , messages: {
                empty: function (data) {
                    throw '\n- No ' + Object.keys(data)[2] + ' to be found...\n'
                }
                , entering: function (data, self) {
                    var account = data.accounts[0]
                    console.info(
                        '\n- Entering '
                        + Object.keys(data)[0].slice(0, -1)
                        + ' "' + account.name
                        + '"...\n'
                    )
                    return account.accountId
                }
                , kind: function (data) {
                    var kind = data.accounts[0].kind.split('#').pop();

                    return 'aeiou'.indexOf(kind[0].toLowerCase()) !== -1
                        ? 'n ' + kind
                        : ' ' + kind
                }
                , choose: function (self, data) {
                    var message = Object.keys(data)[0].slice(0, -1);

                    message = 'aeiou'.indexOf(message[0].toLowerCase()) !== -1
                        ? 'n ' + message
                        : ' ' + message

                    message =
                        '\n- Please, choose a'
                        + message
                        + ':\n'
                        + data.accounts.map(function (e, i, a) { return ' "' + i + '" for "' + e.name + '"' }).join('\n')
                        + '\n'

                    throw message;
                }
            }
        }
        , accounts: function (jwtClient) {
            console.log('----- GTM.accounts')
            var self = this;
            return new P(function (resolve, reject) {
                self.tagManager.accounts.list(
                    //TODO: change with consent screen?
                    { auth: jwtClient }
                    , function (err, response) {
                        if (err) reject(err);
                        resolve(response);
                    });
            });
        }
        , containers: function (jwtClient, contId) {
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

                    var
                        obj = {
                            id: ''
                            , accounts: data.accounts
                            , contId: contId
                            , pass: (
                                contId != undefined
                                &&
                                data.accounts.length > 0
                                &&
                                (contId + 1) <= data.accounts.length
                            )
                        }
                        ;

                    self.logs.data(obj)

                    if (obj.pass) obj.id = data.accounts[contId].accountId;
                    else
                        if (data.accounts.length == 0) self.logs.messages.empty(self, data);
                        else if (data.accounts.length == 1) obj.id = self.logs.messages.entering(data, self);
                        else self.logs.messages.choose(self, data)

                    self.tagManager.accounts.containers.list(
                        {
                            //TODO: change with consent screen?
                            auth: jwtClient
                            , accountId: obj.id
                        }
                        , function (err, response) {
                            if (err) reject(err);
                            resolve(response);
                        });
                })
            });
        }
        , tags: function (jwtClient, contId) {
            console.log('----- GTM.tags')
            var self = this;
            return new P(function (resolve, reject) {
                var containers = self.containers(jwtClient, contId);
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

declaring.end();