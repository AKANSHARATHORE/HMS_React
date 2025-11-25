export const proxify = (url: string) => {
  // Central proxy controller used to tunnel insecure device calls through a secure domain
  return `https://digitalshealthmonitoring.in/proxy/proxy?url=${encodeURIComponent(url)}`;
};

export default proxify;
