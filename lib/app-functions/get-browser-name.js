export function getBrowserName() {
  const userAgent = navigator.userAgent;

  if (userAgent.indexOf("Firefox") > -1) {
    return "Mozilla Firefox";
  } else if (userAgent.indexOf("Edge") > -1) {
    return "Microsoft Edge";
  } else if (userAgent.indexOf("Chrome") > -1) {
    return "Google Chrome";
  } else if (userAgent.indexOf("Safari") > -1) {
    return "Apple Safari";
  } else {
    return null;
  }
}