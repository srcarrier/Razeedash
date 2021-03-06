/**
* Copyright 2019 IBM Corp. All Rights Reserved.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

import { Meteor } from 'meteor/meteor';

const { ApolloLink } = require('apollo-link');
const ApolloClient = require('apollo-boost').ApolloClient;
const fetch = require('cross-fetch/polyfill').fetch;
const createHttpLink = require('apollo-link-http').createHttpLink;
const { onError } = require('apollo-link-error');
const InMemoryCache = require('apollo-cache-inmemory').InMemoryCache;

const getQueryClient = async () => {

    const token = Meteor.user().apiKey ? Meteor.user().apiKey : Meteor.call('getApiKey');

    // strip any trailing / from RAZEEDASH_API_URL
    const regex = /\/*$/gi;
    const API_HOST = Meteor.settings.public.RAZEEDASH_API_URL.replace(regex, '');

    const httpLink = createHttpLink({
        uri: `${API_HOST}/graphql`,
        fetch: fetch,
        headers: {
            'x-api-key': token
        }
    });

    const errorLink = onError(({ graphQLErrors, networkError }) => {
        if (graphQLErrors)
            graphQLErrors.map(({ message, extensions }) => {
                console.error(`[GraphQL error]: Message: ${message}, Type: ${extensions.code}`);
            });
        if (networkError) {
            console.error(`[Network error]: ${networkError}`);
        }
    });

    const links = ApolloLink.from ([
        errorLink,
        httpLink,
    ]);

    const client = new ApolloClient({
        link: links,
        cache: new InMemoryCache(),
    });
    return client;
};

exports.getQueryClient = getQueryClient;
