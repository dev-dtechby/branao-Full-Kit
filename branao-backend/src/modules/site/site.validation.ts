import * as yup from "yup";

export const createSiteSchema = yup.object({
  name: yup.string().required(),
  location: yup.string().optional(),
  address: yup.string().optional(),
});
