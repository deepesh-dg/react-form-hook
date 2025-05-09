# React Form Hook

A reusable, type-safe React hook for managing forms with support for validation (Yup, Zod, or custom), input handling, and error management. Designed for flexibility and ease of use in React applications.

## Summary

`useForm` simplifies form handling by providing:

- **Form State Management**: Tracks values, errors, and touched states.
- **Validation**: Supports Yup, Zod, or custom validation with onChange and onBlur options.
- **Input Support**: Handles text, checkbox, radio, file, date, and number inputs.
- **Developer Control**: Offers methods to set values, errors, and reset forms programmatically.

## API Reference: `useForm` Hook

```tsx
const {
  values,
  errors,
  touched,
  isSubmitting,
  handleChange,
  handleBlur,
  handleSubmit,
  setFieldValue,
  setFieldError,
  setFieldTouched,
  resetForm,
  validateForm,
  getFieldProps,
} = useForm<T>({
  initialValues,         // Initial form values
  validationSchema,      // Yup, Zod, or custom validation (optional)
  onSubmit,              // Submit handler
  validateOnChange = true, // Validate on input change
  validateOnBlur = true,  // Validate on input blur
});
```

### Returns

- `values`: Current form values.
- `errors`: Field-specific validation errors.
- `touched`: Fields interacted with by the user.
- `isSubmitting`: Form submission state.
- `handleChange`: Handles input changes.
- `handleBlur`: Handles input blur events.
- `handleSubmit`: Handles form submission.
- `setFieldValue`: Sets a field's value.
- `setFieldError`: Sets a field's error.
- `setFieldTouched`: Sets a field's touched state.
- `resetForm`: Resets form to initial state.
- `validateForm`: Validates entire form.
- `getFieldProps(field, type)`: Returns `{ inputProps, meta }` for a field:
  - `inputProps`: Props for the input element (`name`, `value`, `onChange`, `onBlur`, `type`, `checked`).
  - `meta`: `{ error, touched }` for UI logic.

### Example Usage

```tsx
import { useForm } from "./useForm";
import * as Yup from "yup";

const schema = Yup.object({
  username: Yup.string().required("Required"),
});

function App() {
  const { handleSubmit, getFieldProps } = useForm({
    initialValues: { username: "" },
    validationSchema: schema,
    onSubmit: (values) => console.log(values),
  });

  return (
    <form onSubmit={handleSubmit}>
      <input {...getFieldProps("username").inputProps} />
      {getFieldProps("username").meta.touched &&
        getFieldProps("username").meta.error && (
          <span>{getFieldProps("username").meta.error}</span>
        )}
      <button type="submit">Submit</button>
    </form>
  );
}
```
