/* eslint-disable no-unused-vars */
import {
  Box,
  Button,
  TextField,
  Select,
  InputLabel,
  MenuItem,
  Paper,
  Typography,
  FormControl,
} from "@mui/material";
import { useState, useCallback, useEffect } from "react";
import { API } from "helpers";
import { EnhancedModal, notify, EnhancedTable } from "components/index";
import { Formik, Form, Field } from "formik";
import { format } from "date-fns";
import MyAlgoConnect from "@randlabs/myalgo-connect";
import _ from "lodash";

const statuses = ["ALL", "INITIATED", "RUNNING", "FAILED", "SUCCESS"];

export const JobManager = () => {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [imageModalIsOpen, setImageModalIsOpen] = useState(false);
  const [signLogicSigModalIsOpen, setSignLogicSigModalIsOpen] = useState(false);
  const [imageModal, setImageModal] = useState("");
  const [job, setJob] = useState([]);
  const [dataForTable, setDataForTable] = useState([]);
  const [services, setServices] = useState([]);
  const [signedLogicSig, setSignedLogicSig] = useState([]);
  const [selectedService, setSelectedService] = useState("");
  const [isFiltered, setIsFiltered] = useState(false);
  const [statusToFilter, setStatusToFilter] = useState(statuses[0]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [blob, setblob] = useState(null);
  const [accountAddress, setAccountAddress] = useState(null);
  const [viewModalIsOpen, setViewModalIsOpen] = useState(false);
  const [viewData, setViewData] = useState({});
  const [json, setJson] = useState("{}");
  const myAlgoWallet = new MyAlgoConnect();
  const myAlgoWalletSettings = {
    shouldSelectOneAccount: true,
    openManager: false,
  };
  const isConnectedToMyAlgoWallet = !!accountAddress;
  const logicSigBase64 = "BTEQgQQSMRQxABIQMRKBABIQRIEBQw==";

  useEffect(() => {
    async function post() {
      setImageUrl(URL.createObjectURL(selectedImage));
      const file = selectedImage;
      const base64 = await convertToBase64(file);
      setblob(base64);
    }
    if (selectedImage) {
      post();
    }
  }, [selectedImage]);

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = () => {
        resolve(fileReader.result);
      };
      fileReader.onerror = (error) => {
        reject(error);
      };
    });
  };

  const dataTypes = ["Generated Data", "Json Data", "Data URL"];
  const [dataTypeSelected, setSelectedDataType] = useState(dataTypes[0]);

  const createJob = async (data) => {
    const response = await API.createJob(data);
    if (response.success) {
      setSelectedService("");
      setSelectedDataType(dataTypes[0]);
      setModalIsOpen(false);
      getJob();
      notify("Job Creation succeeded!!");
    } else {
      setModalIsOpen(false);
      notify("Job Creation Failed!!");
    }
  };

  const getJob = useCallback(async () => {
    const response = await API.getJob();
    if (response.success) {
      setJob(response.data.data);
    } else {
      setJob([]);
      notify("Failed to Fetch Job List");
    }
  }, []);

  const getService = useCallback(async () => {
    const response = await API.getService();
    if (response.success) {
      setServices(response.data.data);
    } else {
      setServices([]);
      notify("Failed to Fetch Service List");
    }
  }, []);

  const handleServiceChange = (event) => {
    if (
      event.target.value.requires_asset_opt_in &&
      signedLogicSig.length === 0
    ) {
      setModalIsOpen(false);
      setSignLogicSigModalIsOpen(true);
      notify("Please sign logic sig to opt in to assets");
      return;
    } else {
      setSelectedService(event.target.value);

      // modify json data
      let tempJson = {};
      try {
        tempJson = JSON.parse(event.target.value.requirements);
      }
      catch (error) {
        notify("Invalid Requirements");
        return;
      }
      setJson(JSON.stringify(tempJson, undefined, 2));
    }
  };

  const handleConnectWalletClick = () => {
    myAlgoWallet
      .connect(myAlgoWalletSettings)
      .then((account) => {
        setAccountAddress(account[0]);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const signLogicSig = () => {
    myAlgoWallet
      .signLogicSig(logicSigBase64, accountAddress.address)
      .then(async (signedLogicSigFromWallet) => {
        let data = { signedLogicSig: Array.from(signedLogicSigFromWallet) };
        const response = await API.setSignedLogicSig(data);
        if (response.success) {
          setSignedLogicSig(response.data.data.signedLogicSig);
          setSignLogicSigModalIsOpen(false);
          notify("Signed logic sig stored successfully!!");
        } else {
          setSignLogicSigModalIsOpen(false);
          notify("Failed to store signed logic sig!!");
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const handleDataTypeChange = (event) => {
    setSelectedDataType(event.target.value);
  };

  const handleJsonChange = (event) => {
    setJson(event.target.value);
  };

  useEffect(() => {
    getService();
  }, [getService]);

  const resetTableData = (data) => {
    setDataForTable(
      data.map((item) => ({
        _id: item._id,
        "Status": item.jobStatus,
        "Job Name": item.jobName,
        "Execution Time": item.executionTime,
        "Operation Time": format(
          new Date(parseInt(item.createdAt)),
          "yyyy-MM-dd HH:mm:ss"
        ),
        insightsURL: item.insightsURL,
        returnedData: item.returnData,
      }))
    );
  };

  useEffect(() => {
    resetTableData(job);
  }, [job]);

  useEffect(() => {
    getJob();
  }, [getJob]);

  const updateTable = useCallback(() => {
    setTimeout(() => {
      getJob();
      resetTableData(job);
    }, 500);
  }, [getJob, job]);

  const getSignedLogicSig = useCallback(async () => {
    const response = await API.getSignedLogicSig();
    if (response.success) {
      setSignedLogicSig(response.data.signedLogicSig);
    } else {
      setSignedLogicSig([]);
      notify("Failed to Fetch Signed LogicSig Exists");
    }
  }, []);

  useEffect(() => {
    getSignedLogicSig();
  }, [getSignedLogicSig]);

  const initialValues = {
    downloadableURL: "",
    jobName: "",
    service: "",
    dataType: "",
    blob: null,
  };

  const handleSubmit = async (values, { resetForm }) => {
    let tempJson;
    if (dataTypeSelected === dataTypes[1]) {
      tempJson = JSON.parse(json);
      if (blob !== null) {
        tempJson.blob = blob;
      }
      if (selectedService.requires_asset_opt_in) {
        tempJson.signedLogicSig = signedLogicSig;
      }
    }

    const data = {
      jobName: values.jobName,
      endpoint: selectedService.url,
      serviceID: selectedService._id,
      datafileURL: {
        url: values.downloadableURL,
        json: dataTypeSelected === dataTypes[1] ? tempJson : "",
      },
    };
    createJob(data);
    resetForm();
  };

  let createJobModal = (
    <Box>
      <Formik initialValues={initialValues} onSubmit={handleSubmit}>
        {({ errors, touched, isSubmitting }) => (
          <Form>
            <InputLabel sx={{ py: 1 }}>Job Name</InputLabel>
            <Field
              as={TextField}
              name="jobName"
              type="text"
              autoComplete="off"
              fullWidth
              error={errors.jobName !== undefined}
              helperText={touched.jobName && errors.jobName}
            />
            <InputLabel sx={{ py: 1 }}>Select Service</InputLabel>
            <Field
              as={Select}
              name="service"
              placeholder="Select Service"
              fullWidth
              value={selectedService}
              label="Service"
              onChange={handleServiceChange}
            >
              {services.map((service, i) => {
                return (
                  <MenuItem value={service} key={i}>
                    {service.name}
                  </MenuItem>
                );
              })}
            </Field>

            <InputLabel sx={{ py: 1 }}>Data Type</InputLabel>
            <Field
              as={Select}
              name="dataType"
              placeholder="Select Datatype"
              fullWidth
              value={dataTypeSelected}
              label="Datatype"
              onChange={handleDataTypeChange}
            >
              {dataTypes.map((type, i) => {
                return (
                  <MenuItem value={type} key={i}>
                    {type}
                  </MenuItem>
                );
              })}
            </Field>
            {dataTypeSelected === dataTypes[1] ? (
              <Box>
                <Typography sx={{ mt: 2 }} variant="body2">
                  * Please keep the data structure and field name and change the
                  values.
                </Typography>
                <Field
                  as={TextField}
                  fullWidth
                  label="Json Data"
                  margin="normal"
                  name="jsonData"
                  value={json}
                  onChange={handleJsonChange}
                  type="text"
                  variant="outlined"
                  multiline
                  rows={10}
                  error={touched.jsonData}
                  helperText={touched.jsonData && errors.jsonData}
                />
                <Button variant="contained" component="label">
                  Upload Image
                  <input
                    type="file"
                    hidden
                    onChange={(e) => setSelectedImage(e.target.files[0])}
                  />
                </Button>
                {imageUrl && selectedImage && (
                  <Box mt={2} textAlign="center">
                    <div>Image Preview:</div>
                    <img
                      src={imageUrl}
                      alt={selectedImage.name}
                      height="100px"
                    />
                  </Box>
                )}
              </Box>
            ) : dataTypeSelected === dataTypes[2] ? (
              <Box>
                <Field
                  as={TextField}
                  fullWidth
                  label="Data URL Link"
                  margin="normal"
                  name="downloadableURL"
                  type="text"
                  variant="outlined"
                  error={
                    touched.downloadableURL && Boolean(errors.downloadableURL)
                  }
                  helperText={touched.downloadableURL && errors.downloadableURL}
                />
              </Box>
            ) : null}
            <Box
              sx={{
                mt: 4,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Button
                color="primary"
                disabled={isSubmitting}
                size="large"
                variant="contained"
                type="submit"
                onClick={() => {
                  setModalIsOpen(false);
                  updateTable();
                }}
              >
                Submit
              </Button>
            </Box>
          </Form>
        )}
      </Formik>
    </Box>
  );

  let signLogicSigModal = (
    <Box>
      {!isConnectedToMyAlgoWallet ? (
        <Box>
          <Typography sx={{ mt: 0 }}>
            Please connect your MyAlgo wallet to continue signing the logic
            signature
          </Typography>
          <Button
            size="middle"
            variant="contained"
            onClick={handleConnectWalletClick}
          >
            {"Connect to MyAlgo Wallet"}
          </Button>
        </Box>
      ) : (
        <Box>
          <Typography sx={{ mt: 0 }}>
            Please sign the logic signature transaction to opt in to assets
          </Typography>
          <Button size="middle" variant="contained" onClick={signLogicSig}>
            {"Sign LogicSig"}
          </Button>
        </Box>
      )}
    </Box>
  );

  let viewBoxModal = (
    <Box sx={{ height: 500 }}>
      {viewData ? (
        <Box>
          <Box
            sx={{ fontWeight: "bold", display: "flex", alignItems: "center" }}
          >
            Job Name: <Typography sx={{ ml: 1 }}>{viewData?.jobName}</Typography>
          </Box>

          <Box
            sx={{ fontWeight: "bold", display: "flex", alignItems: "center" }}
          >
            Status: <Typography sx={{ ml: 1 }}>{viewData?.jobStatus}</Typography>
          </Box>

          <Box sx={{ fontWeight: "bold", alignItems: "top" }}>
            Return Data:{" "}
            <TextField
              multiline
              maxRows={10}
              disabled={true}
              defaultValue={JSON.stringify(viewData?.returnData, undefined, 2)}
              sx={{
                width: "100%",
                height: "100%"
              }}
            />
          </Box>
        </Box>
      ) : null}
    </Box>
  );

  const imageModelContentToShow = (img) => (
    <Box
      sx={{ display: "flex", flexDirection: "row", justifyContent: "center" }}
    >
      <img width="50%" src={img} alt="img" />
    </Box>
  );

  const filterStatus = (status) => {
    setStatusToFilter(status);
    if (status === "ALL") {
      resetTableData(job);
      setIsFiltered(false);
      return;
    }
    if (isFiltered) {
      resetTableData(job);
    }
    setIsFiltered(true);
    setDataForTable((prevState) =>
      prevState.filter((item) => item.Status === status)
    );
  };

  let content = (
    <Box>
      <EnhancedModal
        isOpen={imageModalIsOpen}
        dialogTitle={`Image`}
        dialogContent={imageModelContentToShow(imageModal)}
        options={{
          onClose: () => setImageModalIsOpen(false),
          disableSubmit: true,
        }}
      />
      <EnhancedModal
        isOpen={modalIsOpen}
        dialogTitle={`Create Job service`}
        dialogContent={createJobModal}
        options={{
          onClose: () => setModalIsOpen(false),
          disableSubmit: true,
        }}
      />
      <EnhancedModal
        isOpen={signLogicSigModalIsOpen}
        dialogTitle={`Sign logic Sig`}
        dialogContent={signLogicSigModal}
        options={{
          onClose: () => setSignLogicSigModalIsOpen(false),
          disableSubmit: true,
        }}
      />
      {/* THIS HERE */}
      <EnhancedModal
        isOpen={viewModalIsOpen}
        dialogTitle={`View Service`}
        dialogContent={viewBoxModal}
        options={{
          onClose: () => setViewModalIsOpen(false),
          disableSubmit: true,

        }}
      />
      <Box
        maxWidth="xl"
        sx={{
          textAlign: "right",
          ml: 4,
          pt: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "right",
          gap: 2,
        }}
      >
        <Button
          variant="contained"
          size="middle"
          onClick={() => updateTable()}
        >
          Refresh
        </Button>
        <FormControl sx={{ width: "8.5em" }}>
          <InputLabel>Filter Status:</InputLabel>
          <Select
            label="Filter status"
            value={statusToFilter}
            sx={{ textAlign: "center" }}
            onChange={(e) => {
              filterStatus(e.target.value);
            }}
          >
            {statuses.map((s, i) => (
              <MenuItem value={s} key={i}>
                {s}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          size="middle"
          variant="contained"
          onClick={() => setModalIsOpen(true)}
        >
          Create Job
        </Button>
      </Box>

      <Box maxWidth="xl" sx={{ mt: 2, ml: 4 }}>
        {dataForTable.length > 0 ? (
          <EnhancedTable
            data={dataForTable}
            title=" "
            options={{
              selector: true,
              enableSort: true,
              sortAscending: false,
              selectSortBy: "Operation Time",
              ui: {
                maxHeight: "100%"
              },
              ignoreKeys: [
                "_id",
                "deakinSSO",
                "firstLogin",
                "emailVerified",
                "isBlocked",
                "__v",
                "createdAt",
                "insightsURL",
                "serviceID",
                "returnedData"
              ],
              actions: [
                {
                  name: "",
                  label: "View Results",
                  type: "button",
                  function: async (e, data) => {
                    console.log(data);
                    if (!data) return;
                    const viewData = {};
                    viewData.jobName = data["Job Name"];
                    viewData.jobStatus = data["Status"];
                    viewData.returnData = data["returnedData"];
                    console.log(viewData);

                    setViewData(viewData);
                    setViewModalIsOpen(true);
                  },
                },
                {
                  name: "",
                  label: "Remove",
                  type: "button",
                  function: async (e, data) => {
                    if (!data) return;
                    dataForTable.splice(dataForTable.indexOf(data), 1);
                    setDataForTable((prevState) => [...prevState]);
                  },
                },
              ],
            }}
          />
        ) : (
          <Paper sx={{ py: 4 }}>
            <Typography variant="body1" sx={{ textAlign: "center" }}>
              No Data
            </Typography>
          </Paper>
        )}
      </Box>
    </Box>
  );

  return content;
};
