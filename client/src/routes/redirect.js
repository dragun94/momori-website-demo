// /login으로 보낼 때 원래 가려던 주소를 state.from에 담음 (로그인 후 GuestRoute가 그 주소로 돌려보냄)
export function loginRedirectState(location) {
  return { from: { pathname: location.pathname, search: location.search, hash: location.hash } };
}
