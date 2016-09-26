'use strict';

var declaring = require('./declaring.js');

declaring.start(__filename.split('\\').pop());

var
    google = require('googleapis')
    , P = require('bluebird')
    , helper = require('./helper.js')
    ;

module.exports = {
    GA: {
        analytics: google.analytics('v3')
        , validate: data => {
            if (data.items.length == 0)
                return helper.logs.empty(data);
            else if (data.items.length == 1) {
                helper.logs.entering(data, self);
                profile = data.items[0].id;
            } else return self.messages.choose(data, self)
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
                            helper.logs.messages.entering(data, self);
                            accountId = data.items[0].id;
                        } else return helper.logs.choose(data, self)

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
                            return helper.logs.messages.empty(data);
                        else if (data.items.length == 1) {
                            accountId = data.items[0].accountId;
                            webPropertyId = data.items[0].id;
                        } else return helper.logs.choose(data)

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
        , events: function (jwtClient, query, accNum, webPropNum, profNum) {
                
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

                    if (pass) profile = data.items[profNum].id
                    else profile = helper.validate(data)

                    query.ids = 'ga:' + profile
                    query.auth = jwtClient

                    self.analytics.data.ga.get(query, function (err, res) {
                        if (err) reject(err)
                        resolve(res)
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
                                contId <= (data.accounts.length - 1)
                            )
                        }
                        ;

                    if (obj.pass) obj.id = data.accounts[contId].accountId;
                    else obj.id = helper.validate(data)

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
        , tags: function (jwtClient, contNum) {
            console.log('----- GTM.tags')
            var self = this;
            return new P(function (resolve, reject) {
                var containers = self.containers(jwtClient, contNum);
                containers.then(function (data) {
                    /*
                    TODO:
                    Change for interface choice
                    A gateway validation as well if user has no selected account to look at
                    */

                    helper.logs.data(data);
                    /* 
                                        var
                                            obj = {
                                                accountId: data.containers[contNum].accountId
                                                , containerNum: contNum
                                                , containerId: data.containers[contNum].containerId
                                                , hasNumInput: (contNum != undefined)
                                                , elementsLength: data.containers.lengthc
                                                , containers: data.containers
                                                , pass:
                                                (
                                                    contNum != undefined
                                                    &&
                                                    contNum <= (data.containers.length + 1)
                                                )
                                                    ? 0
                                                    : data.containers.length == 0
                                                        ? 1
                                                        : data.containers.length == 1
                                                            ? 2 : 3
                                            }
                                            ;
                    
                    helper.logs.data(obj);
     
                    if (obj.pass == 0)
                        var
                            accountId = obj.accountId
                            , containerId = obj.containerId
                            ;
                    if (obj.pass == 1)
                        helper.logs.empty()
                    if (obj.pass == 2)
                        if (obj.pass == 3)
                    */


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