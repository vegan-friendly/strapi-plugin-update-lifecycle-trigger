"use strict";

const _ = require("lodash");

module.exports = ({ strapi }) => ({
  updateMediaItems: async (ctx) => {
    const { types, filterByText } = ctx.request.body;
    const updatedItems = [];
    const failedItems = [];

    // Process each media type sequentially
    for (const type of types) {
      let whereCondition;
      switch (type) {
        case "images":
          whereCondition = {
            mime: { $startsWith: "image/" },
          };
          if (filterByText) {
            whereCondition = {
              mime: { $startsWith: "image/" },
              [filterByText]: { $null: true },
            };
          }
          break;
        case "videos":
          whereCondition = { mime: { $startsWith: "video/" } };
          if (filterByText) {
            whereCondition = {
              mime: { $startsWith: "video/" },
              [filterByText]: { $null: true },
            };
          }
          break;
        case "audios":
          whereCondition = { mime: { $startsWith: "audio/" } };
          if (filterByText) {
            whereCondition = {
              mime: { $startsWith: "audio/" },
              [filterByText]: { $null: true },
            };
          }
          break;
        case "files":
          whereCondition = {
            mime: { $not: { $startsWith: ["image/", "video/", "audio/"] } },
          };
          if (filterByText) {
            whereCondition = {
              mime: { $not: { $startsWith: ["image/", "video/", "audio/"] } },
              [filterByText]: { $null: true },
            };
          }
          break;
        default:
          strapi.log.warn(`Unrecognized type: ${type}`);
          continue; // Skip unrecognized types
      }

      let items = [];
      try {
        items = await strapi.query("plugin::upload.file").findMany({
          select: ["id", "mime"],
          where: whereCondition,
        });
      } catch (error) {
        strapi.log.error(
          `Failed to fetch items for type "${type}": ${error.message}`
        );
        continue;
      }

      // Use Lodash to chunk the items array into batches of 20
      const chunks = _.chunk(items, 20);
      for (const chunk of chunks) {
        await Promise.all(
          chunk.map(async (item) => {
            try {
              const updatedItem = await strapi.plugins[
                "upload"
              ].services.upload.update(item.id, {
                updatedAt: new Date().toISOString(),
              });
              updatedItems.push(updatedItem);
            } catch (error) {
              strapi.log.error(
                `Failed to update item ${item.id}: ${error.message}`
              );
              failedItems.push(item.id);
            }
          })
        );
      }
    }

    const message = `${updatedItems.length} media items updated successfully, ${failedItems.length} items failed to update.`;
    strapi.log.info(message);
    ctx.body = { message };
    ctx.status = 200;
  },

  listContentTypes: async (ctx) => {
    try {
      const contentTypes = Object.keys(strapi.contentTypes)
        .filter((type) => type.startsWith("api::"))
        .map((type) => ({
          uid: type,
          name:
            strapi.contentTypes[type].info.singularName ||
            strapi.contentTypes[type].info.pluralName,
          kind: strapi.contentTypes[type].kind,
        }));

      strapi.log.info("User-created content types listed successfully.");
      ctx.body = { contentTypes };
      ctx.status = 200;
    } catch (error) {
      strapi.log.error(
        `An error occurred while listing content types: ${error.message}`
      );
      ctx.body = { message: error.message };
      ctx.status = 500;
    }
  },

  updateContentItems: async (ctx) => {
    const { types } = ctx.request.body;
    const updatedContentItems = [];
    const failedContentItems = [];

    // Process each content type sequentially
    for (const contentType of types) {
      let items = [];
      try {
        items = await strapi.entityService.findMany(`${contentType}`, {
          fields: ["id"],
        });
      } catch (error) {
        strapi.log.error(
          `Failed to fetch items for content type "${contentType}": ${error.message}`
        );
        continue;
      }

      // Use Lodash to chunk the items array into batches of 20
      const chunks = _.chunk(items, 20);
      for (const chunk of chunks) {
        await Promise.all(
          chunk.map(async (item) => {
            try {
              const updatedItem = await strapi.entityService.update(
                `${contentType}`,
                item.id,
                { data: { updatedAt: new Date().toISOString() } }
              );
              updatedContentItems.push(updatedItem);
            } catch (error) {
              strapi.log.error(
                `Failed to update item ${item.id} for content type "${contentType}": ${error.message}`
              );
              failedContentItems.push(item.id);
            }
          })
        );
      }
    }

    const message = `${updatedContentItems.length} content items updated successfully, ${failedContentItems.length} items failed to update.`;
    strapi.log.info(message);
    ctx.body = { message };
    ctx.status = 200;
  },
});
