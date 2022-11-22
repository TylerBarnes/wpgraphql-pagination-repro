const { request, gql } = require("graphql-request")

setImmediate(async () => {
  await reportDuplicateNodesIds({
    nodeType: `ExtensionPlugin`,
    fieldName: `extensionPlugins`,
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

  await reportDuplicateNodesIds({
    nodeType: `Document`,
    fieldName: `documents`,
    query: gql`
      query NODE_LIST_QUERY($first: Int!, $after: String) {
        documents(first: $first, after: $after) {
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
  endCursors = new Set(),
  dupeCount = 0,
  nodeType = ``,
  fieldName = ``,
}) => {
  const data = await request("https://content.wpgraphql.com/graphql", query, {
    first: 20,
    after: endCursor,
  })

  const newEndCursor = data[fieldName].pageInfo.endCursor

  if (endCursors.has(newEndCursor)) {
    console.log(`Found duplicate endCursor: ${newEndCursor}`)
  } else {
    endCursors.add(newEndCursor)
  }

  data[fieldName]?.nodes?.forEach((node) => {
    if (ids.has(node.id)) {
      dupeCount++
      console.log(`found duplicate ${nodeType} node with id ${node.id}`)
    } else {
      ids.add(node.id)
    }
  })

  if (data[fieldName]?.pageInfo?.hasNextPage) {
    await reportDuplicateNodesIds({
      query,
      endCursor: data[fieldName]?.pageInfo?.endCursor,
      ids,
      nodeType,
      dupeCount,
      endCursors,
      fieldName,
    })
  } else {
    console.log(
      `done. ${ids.size} total unique nodes fetched. ${dupeCount} duplicates found.`
    )
  }
}
