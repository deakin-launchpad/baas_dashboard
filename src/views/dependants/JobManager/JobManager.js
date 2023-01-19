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
import * as Yup from "yup";
import { format } from "date-fns";
import {PeraWalletConnect} from "@perawallet/connect";

const statuses = ["ALL", "INITIATED", "RUNNING", "FAILED", "SUCCESS"];

export const JobManager = () => {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [imageModalIsOpen, setImageModalIsOpen] = useState(false);
  const [signLogicSigModalIsOpen, setSignLogicSigModalIsOpen] = useState(false);
  const [imageModal, setImageModal] = useState("");
  const [job, setJob] = useState([]);
  const [dataForTable, setDataForTable] = useState([]);
  const [services, setServices] = useState([]);
  const [signedLogicSigExists, setSignedLogicSigExists] = useState([]);
  const [selectedService, setSelectedService] = useState("");
  const [isFiltered, setIsFiltered] = useState(false);
  const [statusToFilter, setStatusToFilter] = useState(statuses[0]);
  const [accountAddress, setAccountAddress] = useState(null);
  const isConnectedToPeraWallet = !!accountAddress;
  const peraWallet = new PeraWalletConnect({
    shouldShowSignTxnToast: true,
    chainId: "416002"
  });

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

  const viewData = (data) => {
    if (!data.insightsURL) return;
    const regex = /\.(gif|jpe?g|tiff?|png|webp|bmp)$/i;
    const isImage = regex.test(data.insightsURL);
    if (isImage) {
      setImageModal(data.insightsURL);
      setImageModalIsOpen(true);
    } else if (data.dataURL && data.dataURL !== "") {
      window.location.href = data.dataURL;
    } else if (
      data.insightsURL &&
      /\.(doc|doc?x|json|pdf|zip)$/i.test(data.insightsURL)
    ) {
      window.location.href = data.insightsURL;
    }
  };

  useEffect(() => {
    getJob();
  }, [getJob]);

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
    if (event.target.value.requires_asset_opt_in && !signedLogicSigExists) {
      setModalIsOpen(false);
      setSignLogicSigModalIsOpen(true);
      notify("Please sign logic sig to opt in to assets");
      return;
    } else {
      setSelectedService(event.target.value);
    }
  };

  const handleConnectWalletClick = () => {
    peraWallet
      .connect()
      .then((newAccounts) => {
        console.log(newAccounts);
        peraWallet.connector.on("disconnect", handleDisconnectWalletClick);
        setAccountAddress(newAccounts[0]);
      })
      .catch((error) => {
        if (error?.data?.type !== "CONNECT_MODAL_CLOSED") {
          console.log(error);
        }
      });
  };

  const handleDisconnectWalletClick = () => {
    peraWallet.disconnect();
    setAccountAddress(null);
  };

  const handleDataTypeChange = (event) => {
    setSelectedDataType(event.target.value);
  };

  useEffect(() => {
    getService();
  }, [getService]);

  useEffect(() => {
    // Reconnect to the session when the component is mounted
    peraWallet
      .reconnectSession()
      .then((accounts) => {
        if (peraWallet.connector !== null) {
          peraWallet.connector.on("disconnect", handleDisconnectWalletClick);
          if (accounts.length) {
            setAccountAddress(accounts[0]);
          }
        }
      })
      .catch((e) => console.log(e));
  });


  const resetTableData = (data) => {
    setDataForTable(
      data.map((item) => ({
        Status: item.jobStatus,
        "Job Name": item.jobName,
        "Execution Time": item.executionTime,
        "Operation Time": format(
          new Date(parseInt(item.createdAt)),
          "yyyy-MM-dd HH:mm:ss"
        ),
        insightsURL: item.insightsURL,
      }))
    );
  };

  useEffect(() => {
    resetTableData(job);
  }, [job]);

  const getSignedLogicSigExists = useCallback(async () => {
    const response = await API.getSignedLogicSigExists();
    if (response.success) {
      setSignedLogicSigExists(response.data);
    } else {
      setSignedLogicSigExists([]);
      notify("Failed to Fetch Signed LogicSig Exists");
    }
  }, []);

  useEffect(() => {
    getSignedLogicSigExists();
  }, [getSignedLogicSigExists]);

  const initialValues = {
    downloadableURL: "",
    jsonData: `{"numberToSet":  }`,
    jobName: "",
    service: "",
    dataType: "",
  };

  const validationSchema = () => {
    return Yup.object().shape({
      downloadableURL: Yup.string().max(255),
      jobName: Yup.string().required("Job name is required"),
      jsonData: Yup.object(),
    });
  };

  const handleSubmit = async (values, { resetForm }) => {
    const data = {
      jobName: values.jobName,
      endpoint: selectedService.url,
      serviceID: selectedService._id,
      datafileURL: {
        url: values.downloadableURL,
        json: dataTypeSelected === dataTypes[1] ? values.jsonData : "",
      },
    };
    if (dataTypeSelected === dataTypes[1]) {
      createJob(data);
    }
    resetForm();
  };

  let createJobModal = (
    <Box>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
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
                  type="text"
                  variant="outlined"
                  multiline
                  rows={10}
                  error={touched.jsonData}
                  helperText={touched.jsonData && errors.jsonData}
                />
              </Box>
            ) : dataTypeSelected === dataTypes[2] ? (
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
            ) : null}
            <Box sx={{ mt: 2 }}>
              <Button
                color="primary"
                disabled={isSubmitting}
                size="large"
                variant="contained"
                type="submit"
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
      <Typography sx={{ mt: 0 }}>
        Please sign the logic signature transaction to opt in to assets
      </Typography>
      <Button
        size="middle"
        variant="contained"
        onClick={isConnectedToPeraWallet ? handleDisconnectWalletClick : handleConnectWalletClick}
      >
        {isConnectedToPeraWallet ? "Disconnect" : "Connect to Pera Wallet"}
      </Button>
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
        <Button
          size="middle"
          variant="contained"
          onClick={() => setModalIsOpen(true)}
        >
          {signedLogicSigExists === false ? "No Signed Logic Sig" : "Signed Logic Sig"}
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
              ignoreKeys: [
                "deakinSSO",
                "firstLogin",
                "emailVerified",
                "isBlocked",
                "__v",
                "createdAt",
                "insightsURL",
                "serviceID",
              ],
              actions: [
                {
                  name: "",
                  label: "View",
                  type: "button",
                  function: async (e, data) => {
                    if (!data) return;
                    viewData(data);
                  },
                },
                {
                  name: "",
                  label: "remove",
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
