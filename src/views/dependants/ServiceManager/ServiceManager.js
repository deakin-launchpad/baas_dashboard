import {
  Box,
  Typography,
  CardContent,
  Card,
  Button,
  TextField,
  FormControl,
  Paper,
} from "@mui/material";
import { useState, useCallback, useEffect } from "react";
import { API } from "helpers";
import { EnhancedModal, notify, EnhancedTable } from "components/index";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { FormControlLabel, Switch } from "../../../../node_modules/@mui/material/index";

export const ServiceManager = () => {
  const [service, setService] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedService, setSelectedService] = useState("");
  const [serviceModal, setserviceModal] = useState(false);

  const getService = useCallback(async () => {
    const response = await API.getService();
    if (response.success) {
      const res = response.data.data;
      let result = [];
      res.map((item) => {
        let data = {
          Name: item.name,
          ID: item._id,
          Requirements: JSON.parse(item.requirements),
          URL: item.url,
          Endpoint: item.endpoint,
          Cost: item.cost,
          "Creator ID": item.creator_id ?? "null",
          "Requires Asset Opt In": item.requires_asset_opt_in
        };
        result.push(data);
      });
      setService(result);
    } else {
      setService([]);
      notify("Failed to Fetch Service List");
    }
  }, []);

  useEffect(() => {
    getService();
  }, [getService]);

  const createService = async (data) => {

    try {
      const requirementsObj = JSON.parse(data.requirements);
      data.requirements = JSON.stringify(requirementsObj);
    } catch (error) {
      notify("Invalid Requirements");
      return;
    }

    const response = await API.createService(data);
    if (response.success) {
      setserviceModal(false);
      getService();
    } else {
      setserviceModal(false);
      notify("Service Creation Failed!!");
    }
  };

  const initialValues = {
    url: "",
    endpoint: "",
    name: "",
    cost: "",
    requirements: "",
    "requiresAssetOptIn": false
  };

  const validationSchema = () => {
    return Yup.object().shape({
      url: Yup.string().max(255).required("URL Is Required"),
      endpoint: Yup.string().max(255).required("Endpoint Is Required"),
      name: Yup.string().min(5).max(255).required("Password Is Required"),
      cost: Yup.number().required("Description Is Required"),
      requirements: Yup.string().required("Requirements Are Required"),
      requiresAssetOptIn: Yup.boolean().required("Asset Opt In needs to be specified")
    });
  };

  const handleSubmit = async (values, { resetForm }) => {
    const data = {
      url: values.url,
      endpoint: values.endpoint,
      name: values.name,
      serviceId: values.serviceId,
      cost: values.cost,
      requirements: values.requirements,
      requiresAssetOptIn: values.requiresAssetOptIn
    };
    createService(data);
    resetForm();
  };

  let createServiceModal = (
    <Box>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, isSubmitting }) => (
          <Form>
            <Field
              as={TextField}
              fullWidth
              label="Service Name"
              margin="normal"
              name="name"
              type="text"
              variant="outlined"
              error={touched.name && Boolean(errors.name)}
              helperText={touched.name && errors.name}
            />
            <Field
              as={TextField}
              fullWidth
              label="URL Link"
              margin="normal"
              name="url"
              type="text"
              variant="outlined"
              error={touched.url && Boolean(errors.url)}
              helperText={touched.url && errors.url}
            />
            <Field
              as={TextField}
              fullWidth
              label=" Endpoint"
              margin="normal"
              name="endpoint"
              type="text"
              variant="outlined"
              error={touched.endpoint && Boolean(errors.endpoint)}
              helperText={touched.endpoint && errors.endpoint}
            />
            <Field
              as={TextField}
              fullWidth
              label="Cost"
              margin="normal"
              name="cost"
              type="text"
              variant="outlined"
              error={touched.cost && Boolean(errors.cost)}
              helperText={touched.cost && errors.cost}
            />
            <Field
              as={TextField}
              fullWidth
              label="Requirements"
              margin="normal"
              name="requirements"
              type="text"
              multiline
              rows={10}
              placeholder={`{\n 'levelOneData’: {\n 'levelTwoDataString’: 'string’,\n 'levelTwoDataNumber’: 0,\n },\n 'levelOneOtherData’: 0,\n 'levelOneOtherOtherData’: 'string'\n }`}
              variant="outlined"
              error={touched.requirements && Boolean(errors.requirements)}
              helperText={touched.requirements && errors.requirements}
            />
            <FormControlLabel
              label="Requires Asset Opt In"
              labelPlacement="start"
              style={{ marginLeft: '0px' }}
              control={
                <Field
                  as={Switch}
                  id="requiresAssetOptIn"
                  label="Requires Asset Opt In"
                  margin="normal"
                  name="requiresAssetOptIn"
                  type="checkbox"
                />
              }
            />
            <Box sx={{ mt: 2 }}>
              <Button
                color="primary"
                disabled={isSubmitting}
                size="large"
                variant="contained"
                type="submit"
              >
                Create Service
              </Button>
            </Box>
          </Form>
        )}
      </Formik>
    </Box>
  );

  let ServiceDetailModal = (
    <Box>
      <FormControl fullWidth>
        <Card>
          <CardContent>
            <Typography
              component="div"
              sx={{
                textOverflow: "ellipsis",
                overflow: "hidden",
              }}
              gutterBottom
            >
              {selectedService.Name}
            </Typography>
            <Typography variant="body2">
              <b>Creator ID: </b> {selectedService["Creator ID"] ?? "null"}
              <br />
            </Typography>
            <Typography variant="body2">
              <b>Service ID:</b> {selectedService.ID}
              <br />
            </Typography>
            <Typography variant="body2">
              <b>  Service Link: </b>{selectedService.URL}
              <br />
            </Typography>
            <Typography variant="body2">
              <b>  Endpoint route:</b> {selectedService.Endpoint}
              <br />
            </Typography>
            <br />
            <Typography variant="body2">
              Price: ${selectedService.Cost}
              <br />
            </Typography>
            <Typography variant="body2">
              Asset Opt In Required: {selectedService["Requires Asset Opt In"]?.toString()}
              <br />
            </Typography>
            <br />
            <Typography variant="body2">
              <b>  Requirements:</b>
              <br />
              <TextField
                defaultValue={JSON.stringify(selectedService?.Requirements, undefined, 2)}
                multiline={true}
                rows={10}
                disabled={true}
                sx={{
                  width: "100%",
                }}
              />

            </Typography>
          </CardContent>
        </Card>
      </FormControl>
    </Box>
  );

  let content = (
    <Box>
      <EnhancedModal
        isOpen={modalIsOpen}
        dialogTitle={`Detail of Service`}
        dialogContent={ServiceDetailModal}
        options={{
          onClose: () => setModalIsOpen(false),
          disableSubmit: true,
        }}
      />
      <EnhancedModal
        isOpen={serviceModal}
        dialogTitle={`Create New Service`}
        dialogContent={createServiceModal}
        options={{
          onClose: () => setserviceModal(false),
          disableSubmit: true,
        }}
      />
      {/* <Box maxWidth="xl" sx={{ textAlign: "right", ml: 4 }}>
        <Button
          size="middle"
          variant="contained"
          onClick={() => setserviceModal(true)}
        >
          Create Service
        </Button>
      </Box> */}
    </Box>
  );

  let tablecontent = (
    <Box maxWidth="xl" sx={{ mt: 2, ml: 4 }}>
      {service.length > 0 ? (
        <EnhancedTable
          data={service}
          title="Service Manager"
          options={{
            ui: {
              maxHeight: "100%"
            },
            ignoreKeys: ["__v", "Requirements", "URL", "Endpoint", "Creator ID"],
            toolbarActions: [
              {
                label: "Create Service",
                function: () => {
                  setserviceModal(true);
                },
              }
            ],
            actions: [
              {
                name: "",
                label: "View Details",
                type: "button",
                function: async (e, data) => {
                  setSelectedService(data);
                  setModalIsOpen(true);
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
  );
  return (
    <Box>
      {content}
      {tablecontent}
    </Box>
  );
};
