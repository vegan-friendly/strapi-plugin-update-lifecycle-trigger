import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Loader,
  Status,
  MultiSelectNested,
  Checkbox,
  TextInput,
} from "@strapi/design-system";
import styled from "styled-components";
import { useFetchClient } from "@strapi/helper-plugin";

const StyledWrapper = styled.div`
  margin-bottom: 24px;
`;

const DEFAULT_LIMIT = -1; // if -1, no limit
const DEFAULT_CHUNK_SIZE = 10;
const CHUNK_SIZE_MIN = 1;
const CHUNK_SIZE_MAX = 500;
const DEFAULT_SLEEP_DURATION = 5000; //5 second

const MediaTab = () => {
  const fetchClient = useFetchClient();
  const [values, setValues] = useState([]);
  const [regenerating, setRegenerating] = useState(false);
  const [requested, setRequested] = useState(false);
  const [message, setMessage] = useState("");
  const [variant, setVariant] = useState("");
  const [filterByText, setfilterByText] = useState("");
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [chunkSize, setChunkSize] = useState(DEFAULT_CHUNK_SIZE);
  const [chunkSizeInputError, setChunkSizeInputError] = useState(false);
  const [sleepDuration, setSleepDuration] = useState(DEFAULT_SLEEP_DURATION);

  const handleChunkSizeChange = (value) => {
    if (value >= CHUNK_SIZE_MIN && value <= CHUNK_SIZE_MAX) {
      setChunkSizeInputError(false);
      setChunkSize(value);
    } else {
      setChunkSizeInputError(true);
    }
  };

  const handleLimitChange = (e) => {
    if (
      e.target.value === "" ||
      !e.target.value ||
      e.target.value < -1 ||
      e.target.value === 0
    ) {
      setLimit(DEFAULT_LIMIT);
    } else {
      setLimit(e.target.value);
    }
  };

  const mediaOptions = [
    {
      label: "All",
      children: [
        {
          label: "Images",
          value: "images",
        },
        {
          label: "Videos",
          value: "videos",
        },
        {
          label: "Audios",
          value: "audios",
        },
        {
          label: "Files",
          value: "files",
        },
      ],
    },
  ];

  const handleRegenerate = async () => {
    if (regenerating || chunkSizeInputError) return;
    setRequested(false);
    setRegenerating(true);

    const options = {
      limit: +limit,
      chunkSize: +chunkSize,
      sleepDuration: +sleepDuration,
      filterByText: filterByText.toLowerCase().trim(),
    };
    console.log("options", options);

    try {
      const response = await fetchClient.post("/strapi-regenerator/media", {
        types: values,
        options,
      });
      if (response.status >= 200 && response.status < 300) {
        setMessage(response.data.message);
        setVariant("success");
      } else {
        setMessage(response.data.message);
        setVariant("danger");
      }
    } catch (error) {
      setMessage(
        error.response
          ? error.response.data.message
          : "An error occurred during the request."
      );
      setVariant("danger");
    } finally {
      setRegenerating(false);
      setRequested(true);
      setTimeout(() => {
        setRequested(false);
      }, 10000);
    }
  };

  return (
    <Box background="neutral0" shadow="tableShadow" padding={10} hasRadius>
      <StyledWrapper>
        <Typography variant="beta" id="media-items">
          Media items
        </Typography>
      </StyledWrapper>
      <StyledWrapper>
        <MultiSelectNested
          label="Media item types"
          required
          withTags
          placeholder="Select media item types to regenerate..."
          onClear={() => setValues([])}
          value={values}
          onChange={setValues}
          options={mediaOptions}
        />
      </StyledWrapper>
      <StyledWrapper>
        <Typography variant="beta" id="media-items">
          Skip if following field is populated (e.g. "blurhash")
        </Typography>
        <TextInput
          label="If the field with this name is populated in the entry, update will be skipped for this entry.
Leave this box empty to update all entries.
At the moment, this field can take only one field-name parameter."
          placeholder="Enter field name"
          onChange={(e) => setfilterByText(e.target.value)}
        />
      </StyledWrapper>
      <StyledWrapper>
        <Typography variant="beta" id="media-items">
          Sets a limit to the number of files you wish to update (defaults to no
          limit)
        </Typography>
        <TextInput
          type="number"
          label={`leave empty to set no limit. Current limit is set to: ${
            limit === DEFAULT_LIMIT ? "no limit" : limit
          }`}
          placeholder="Enter limit"
          onChange={handleLimitChange}
        />
      </StyledWrapper>
      <StyledWrapper>
        <Typography variant="beta" id="media-items">
          Sets the number of items for every chunk (defaults to{" "}
          {DEFAULT_CHUNK_SIZE})
        </Typography>
        <TextInput
          hasError={chunkSizeInputError}
          type="number"
          label={`leave empty to set to default value.`}
          placeholder="Enter chunk size"
          onChange={(e) =>
            handleChunkSizeChange(e.target.value ?? DEFAULT_CHUNK_SIZE)
          }
        />
      </StyledWrapper>
      <StyledWrapper>
        <Typography variant="beta" id="media-items">
          Sets the sleep duration between each chunk (defaults to{" "}
          {DEFAULT_SLEEP_DURATION / 1000}s)
        </Typography>
        <TextInput
          type="number"
          label={`leave empty to set to default value of ${
            DEFAULT_SLEEP_DURATION / 1000
          }s.`}
          placeholder="Enter sleep duration in MS"
          onChange={(e) =>
            setSleepDuration(e.target.value ?? DEFAULT_SLEEP_DURATION)
          }
        />
      </StyledWrapper>
      <StyledWrapper>
        <Button
          variant="default"
          disabled={values.length === 0 || chunkSizeInputError}
          onClick={handleRegenerate}
        >
          Regenerate
        </Button>
      </StyledWrapper>
      {regenerating ? <Loader>Regenerating media...</Loader> : ""}
      {requested && (
        <Status variant={variant} showBullet={false}>
          <Typography>{message}</Typography>
        </Status>
      )}
    </Box>
  );
};

export default MediaTab;
