const { request, gql } = require("graphql-request")

setImmediate(async () => {
  await reportDuplicateNodesIds({
    nodeType: `ExtensionPlugin`,
    query: gql`
      query NODE_LIST_QUERY($first: Int!, $after: String) {
        extensionPlugins(first: $first, after: $after) {
          nodes {
            id
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `,
  })
})

const reportDuplicateNodesIds = async ({
  query,
  endCursor = null,
  ids = new Set(),
  dupeCount = 0,
  nodeType = ``,
}) => {
  const data = await request("https://content.wpgraphql.com/graphql", query, {
    first: 20,
    after: endCursor,
  })

  data?.extensionPlugins?.nodes?.forEach((node) => {
    if (ids.has(node.id)) {
      dupeCount++
      console.log(`found duplicate ${nodeType} node with id ${node.id}`)
    } else {
      ids.add(node.id)
    }
  })

  if (data.extensionPlugins?.pageInfo?.hasNextPage) {
    await reportDuplicateNodesIds({
      query,
      endCursor: data.extensionPlugins?.pageInfo?.endCursor,
      ids,
      nodeType,
      dupeCount,
    })
  } else {
    console.log(
      `done. ${ids.size} total unique nodes fetched. ${dupeCount} duplicates found.`
    )
  }
}
