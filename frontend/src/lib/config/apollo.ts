export const apolloConfig = {
    http: {
      uri: process.env.REACT_APP_BASE_GRAPHQL_URI,
    },
    ws: {
        url: process.env.REACT_APP_BASE_GRAPHQL_URL,
    },
  } as const;
  
  export const validateConfig = () => {
    if (!apolloConfig.http.uri) {
      throw new Error('REACT_APP_BASE_GRAPHQL_URI is required');
    }
    if (!apolloConfig.ws.url) {
      throw new Error('REACT_APP_BASE_GRAPHQL_URL is required');
    }
  };