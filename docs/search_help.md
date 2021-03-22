# Advanced Search

> based on https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-simple-query-string-query.html#simple-query-string-syntax

## Syntax

The following operators are supported:

- `+` signifies AND operation
- `|` signifies OR operation
- `-` negates a single token
- `"` wraps a number of tokens to signify a phrase for searching
- `*` at the end of a term signifies a prefix query
- `(` and `)` signify precedence
- `~N` after a word signifies edit distance (fuzziness)
- `~N` after a phrase signifies slop amount

To use one of these characters literally, escape it with a preceding backslash
(`\`).
