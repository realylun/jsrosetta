#!/usr/bin/env bash
# Smoke-checks the i18n/SEO acceptance criteria against a running server.
# Usage: [SITE_URL=<origin baked into the build>] scripts/verify-i18n.sh [base-url] [untranslated-slug]
#   pnpm build && PORT=3100 pnpm start &
#   SITE_URL=http://localhost:3000 scripts/verify-i18n.sh http://localhost:3100 some-vi-only-post
set -uo pipefail

BASE="${1:-http://localhost:3000}"
# Absolute URLs in the HTML/XML use NEXT_PUBLIC_SITE_URL from build time, not the server address.
SITE="${SITE_URL:-$BASE}"
UNTRANSLATED="${2:-}"
POST="variables"
failures=0

pass() { printf 'PASS  %s\n' "$1"; }
fail() { printf 'FAIL  %s\n' "$1"; failures=$((failures + 1)); }

status() { curl -s -o /dev/null -w '%{http_code}' "${@:2}" "$BASE$1"; }
body() { curl -s "$BASE$1"; }

expect_status() { # path expected [curl args...]
  local got
  got="$(status "$1" "${@:3}")"
  [[ "$got" == "$2" ]] && pass "$1 -> $2" || fail "$1 -> expected $2, got $got"
}

expect_redirect() { # path location
  local location
  location="$(curl -s -o /dev/null -w '%{redirect_url}' "$BASE$1")"
  [[ "$location" == "$BASE$2" ]] && pass "$1 redirects to $2" || fail "$1 redirect: got '$location'"
}

expect_contains() { # label haystack needle
  [[ "$2" == *"$3"* ]] && pass "$1" || fail "$1 (missing: $3)"
}

expect_missing() { # label haystack needle
  [[ "$2" != *"$3"* ]] && pass "$1" || fail "$1 (unexpected: $3)"
}

for path in / /en /posts/$POST /en/posts/$POST /lang/go /en/lang/go /feed.xml /en/feed.xml /sitemap.xml; do
  expect_status "$path" 200
done
expect_status /does-not-exist 404
expect_status /en/does-not-exist 404

expect_redirect /vi /
expect_redirect "/vi/posts/$POST" "/posts/$POST"
expect_status / 200 -H 'Accept-Language: en'
expect_contains "Accept-Language: en on / stays Vietnamese" \
  "$(curl -s -H 'Accept-Language: en' "$BASE/")" '<html lang="vi"'

vi_home="$(body /)"
en_home="$(body /en)"
expect_contains "/ has lang=vi" "$vi_home" '<html lang="vi"'
expect_contains "/en has lang=en" "$en_home" '<html lang="en"'
expect_contains "/ og:locale vi_VN" "$vi_home" 'property="og:locale" content="vi_VN"'
expect_contains "/en og:locale en_US" "$en_home" 'property="og:locale" content="en_US"'

vi_post="$(body /posts/$POST)"
en_post="$(body /en/posts/$POST)"
for page in vi en; do
  html="${page}_post"
  html="${!html}"
  count="$(grep -oi 'hreflang="[^"]*"' <<<"$html" | tr '[:upper:]' '[:lower:]' | sort -u | tr '\n' ' ')"
  [[ "$count" == 'hreflang="en" hreflang="vi" hreflang="x-default" ' ]] &&
    pass "$page post has hreflang vi/en/x-default" || fail "$page post hreflang: $count"
  expect_contains "$page post x-default -> vi URL" "$html" "hrefLang=\"x-default\" href=\"$SITE/posts/$POST\""
done
expect_contains "vi post canonical" "$vi_post" "rel=\"canonical\" href=\"$SITE/posts/$POST\""
expect_contains "en post canonical" "$en_post" "rel=\"canonical\" href=\"$SITE/en/posts/$POST\""
expect_contains "en post og:locale:alternate vi_VN" "$en_post" 'property="og:locale:alternate" content="vi_VN"'

for page in / /en /posts/$POST /en/posts/$POST; do
  image="$(body "$page" | grep -o 'property="og:image" content="[^"]*"' | head -1 | sed 's/.*content="//; s/"$//')"
  image="${image/#$SITE/$BASE}"
  got="$(curl -s -o /dev/null -w '%{http_code} %{content_type}' "$image")"
  [[ "$got" == "200 image/png" ]] && pass "$page og:image served without redirect" ||
    fail "$page og:image $image -> $got"
done

expect_contains "/feed.xml language vi" "$(body /feed.xml)" '<language>vi</language>'
en_feed="$(body /en/feed.xml)"
expect_contains "/en/feed.xml language en" "$en_feed" '<language>en</language>'
expect_contains "/en/feed.xml links /en/posts" "$en_feed" "<link>$SITE/en/posts/$POST</link>"

sitemap="$(body /sitemap.xml)"
expect_contains "sitemap has xhtml:link alternates" "$sitemap" '<xhtml:link rel="alternate" hreflang="en"'

if [[ -n "$UNTRANSLATED" ]]; then
  expect_status "/posts/$UNTRANSLATED" 200
  expect_status "/en/posts/$UNTRANSLATED" 404
  vi_only="$(body "/posts/$UNTRANSLATED")"
  expect_missing "untranslated post has no hreflang en" "$vi_only" 'hrefLang="en"'
  expect_missing "untranslated post has no og:locale:alternate" "$vi_only" 'og:locale:alternate'
  expect_missing "untranslated post not on /en" "$en_home" "/posts/$UNTRANSLATED"
  expect_missing "untranslated post not in /en/feed.xml" "$en_feed" "/posts/$UNTRANSLATED"
  expect_missing "untranslated post has no EN sitemap entry" "$sitemap" "/en/posts/$UNTRANSLATED"
  expect_contains "untranslated post has a VI sitemap entry" "$sitemap" "$SITE/posts/$UNTRANSLATED"
  for lang in go rust swift java; do
    expect_missing "untranslated post not on /en/lang/$lang" "$(body "/en/lang/$lang")" "/posts/$UNTRANSLATED"
  done
fi

echo
if ((failures > 0)); then
  echo "$failures check(s) failed"
  exit 1
fi
echo "All checks passed"
