import { ApolloClient, InMemoryCache, HttpLink, ApolloLink, from } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { apolloConfig } from './config/apollo';

const httpUri = apolloConfig.http.uri;
const wsUrl = apolloConfig.ws.url;

if (!httpUri || !wsUrl) {
  throw new Error('GraphQL URLs are not configured. Check your environment variables.');
}

const httpLink = new HttpLink({
  uri: httpUri,
  credentials: 'include',
});


const wsLink = new GraphQLWsLink(
  createClient({
    url: wsUrl,
    connectionParams: () => {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('Authentication='))
        ?.split('=')[1];

      return { authorization: token ? `Bearer ${token}` : '' };
    },
    shouldRetry: () => true,
    retryAttempts: 10,
  })
);

const splitLink = ApolloLink.split(
  operation => {
    const definition = getMainDefinition(operation.query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink
);

export const apolloClient = new ApolloClient({
  link: from([splitLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});
