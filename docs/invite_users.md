# invite users

1. navigate to https://api.ewaab.org/graphql
2. create a graphql mutation for adding a new user:

```graphql
mutation inviteUser {
  inviteUser(name:"Kaitlin", email:"<email>", type:admin, alumniYear:2020, executeAdmin:true)
}
```

3. if `executeAdmin` is not set to true, you need to add an authorization bearer token. click on HTTP Headers on the bottom, and add the following:

```json
{
  "Authorization":"Bearer <token>"
}
```

You can get the token from going to https://network.ewaab.org/account?dev.
