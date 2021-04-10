# invite users

1. navigate to https://api.ewaab.org/graphql
2. create a graphql mutation for adding a new user:

```graphql
mutation inviteUser {
  inviteUser(name: "Kaitlin", email: "<email>", alumniYear: 2020, type: user)
}
```

3. if `executeAdmin` is not set to true, you need to add an authorization bearer token. click on HTTP Headers on the bottom, and add the following:

```json
{
  "Authorization":"Bearer <token>"
}
```

You can get the token from going to https://network.ewaab.org/account?dev.

## user authorization codes

Sometimes you may want to invite users for an organization / company, and you want to restrict that access for when they give you funding (or for any reason). To handle this, you can create an account using code login. Here's the mutation:

```graphql
mutation addUserCode {
  addUserCode(name: "external-company", executeAdmin: true)
}
```

Again, executeAdmin is optional, and will be disabled in production. You can also remove user codes with the `deleteUserCode` mutation.

## user types

current user types:
- `user` - ewaab participant
- `visitor` - 3rd party hr person
- `mentor` - ewaab mentor
- `admin` - admin user
