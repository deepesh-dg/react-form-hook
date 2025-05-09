import useForm from "./hooks/useForm";
import * as Yup from "yup";

const schema = Yup.object({
    username: Yup.string().required("Username is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    isActive: Yup.boolean(),
    profilePicture: Yup.mixed().required("Profile picture is required"),
    birthDate: Yup.date().required("Birth date is required"),
    gender: Yup.string().required("Gender is required"),
});

export default function App() {
    const { values, errors, touched, handleSubmit, getFieldProps } = useForm({
        initialValues: {
            username: "",
            email: "",
            isActive: false,
            profilePicture: null,
            birthDate: "",
            gender: "",
        },
        validationSchema: schema,
        onSubmit: async (values, { resetForm }) => {
            console.log("Form submitted:", values);
            resetForm();
        },
    });

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label>Username</label>
                <input {...getFieldProps("username").inputProps} />
                {touched.username && errors.username && (
                    <span style={{ color: "red" }}>{errors.username}</span>
                )}
            </div>

            <div>
                <label>Email</label>
                <input {...getFieldProps("email").inputProps} />
                {touched.email && errors.email && (
                    <span style={{ color: "red" }}>{errors.email}</span>
                )}
            </div>

            <div>
                <label>
                    <input
                        {...getFieldProps("isActive", "checkbox").inputProps}
                    />
                    Active
                </label>
                {touched.isActive && errors.isActive && (
                    <span style={{ color: "red" }}>{errors.isActive}</span>
                )}
            </div>

            <div>
                <label>Profile Picture</label>
                <input
                    {...getFieldProps("profilePicture", "file").inputProps}
                />
                {touched.profilePicture && errors.profilePicture && (
                    <span style={{ color: "red" }}>
                        {errors.profilePicture}
                    </span>
                )}
            </div>

            <div>
                <label>Birth Date</label>
                <input {...getFieldProps("birthDate", "date").inputProps} />
                {touched.birthDate && errors.birthDate && (
                    <span style={{ color: "red" }}>{errors.birthDate}</span>
                )}
            </div>

            <div>
                <label>Gender</label>
                <label>
                    <input
                        {...getFieldProps("gender", "radio").inputProps}
                        value="male"
                        checked={values.gender === "male"}
                    />
                    Male
                </label>
                <label>
                    <input
                        {...getFieldProps("gender", "radio").inputProps}
                        value="female"
                        checked={values.gender === "female"}
                    />
                    Female
                </label>
                {touched.gender && errors.gender && (
                    <span style={{ color: "red" }}>{errors.gender}</span>
                )}
            </div>

            <button type="submit">Submit</button>
        </form>
    );
}
