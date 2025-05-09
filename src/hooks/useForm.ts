/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useCallback, useMemo } from "react";
import { Schema, ValidationError } from "yup";
import { ZodSchema, ZodError } from "zod";

type ValidationSchema<T> =
    | Schema<T>
    | ZodSchema<T>
    | ((
          values: InitialValuesType<T>
      ) => FormErrors<T> | Promise<FormErrors<T>>);
type FormErrors<T> = Partial<Record<keyof T, string>>;
type FormTouched<T> = Partial<Record<keyof T, boolean>>;

type InitialValuesType<T> = {
    [K in keyof T]: T[K] | null | undefined | "";
};

interface UseFormOptions<T> {
    initialValues: InitialValuesType<T>;
    validationSchema?: ValidationSchema<T>;
    validateOnChange?: boolean;
    validateOnBlur?: boolean;
    onSubmit: (
        values: T,
        actions: {
            resetForm: () => void;
            setSubmitting: (isSubmitting: boolean) => void;
        }
    ) => void | Promise<void>;
}

export default function useForm<T extends Record<string, any>>({
    initialValues,
    validationSchema,
    onSubmit,
    validateOnChange = true,
    validateOnBlur = true,
}: UseFormOptions<T>) {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState<FormErrors<T>>({});
    const [touched, setTouched] = useState<FormTouched<T>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateField = useCallback(
        async (field: keyof T, value: any): Promise<string | undefined> => {
            if (!validationSchema) return;

            try {
                if (validationSchema instanceof Schema) {
                    await validationSchema.validateAt(field.toString(), {
                        [field]: value,
                    });
                    return;
                }

                if (validationSchema instanceof ZodSchema) {
                    await validationSchema.parseAsync({
                        [field]: value,
                    });

                    return;
                }

                const validationErrors = await validationSchema({
                    ...values,
                    [field]: value,
                });
                if (validationErrors[field.toString()])
                    throw new Error(validationErrors[field.toString()]);
            } catch (error) {
                if (error instanceof ValidationError || error instanceof Error)
                    return error.message;

                if (error instanceof ZodError)
                    return (
                        error.issues.find((issue) =>
                            issue.path.includes(field.toString())
                        )?.message || `Invalid value`
                    );

                return `Invalid value`;
            }
        },
        [validationSchema, values]
    );

    const validateForm = useCallback(async (): Promise<FormErrors<T>> => {
        if (!validationSchema) return {};

        try {
            if (validationSchema instanceof Schema) {
                await validationSchema.validate(values, { abortEarly: false });
                return {};
            }

            if (validationSchema instanceof ZodSchema) {
                await validationSchema.parseAsync(values);
                return {};
            }

            return await validationSchema(values);
        } catch (error) {
            if (error instanceof ValidationError)
                return error.inner.reduce((acc: FormErrors<T>, err: any) => {
                    acc[err.path as keyof T] = err.message;
                    return acc;
                }, {});

            if (error instanceof ZodError)
                return error.issues.reduce((acc, issue) => {
                    const field = issue.path[0] as keyof T;
                    acc[field] = issue.message;
                    return acc;
                }, {} as FormErrors<T>);

            return {};
        }
    }, [validationSchema, values]);

    const handleChange = useCallback(
        async (
            e: React.ChangeEvent<
                HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
            >
        ) => {
            const { name, value, type } = e.target;
            let fieldValue: any;

            switch (type) {
                case "file":
                    {
                        const input = e.target as HTMLInputElement;
                        fieldValue =
                            input.files?.length === 1
                                ? input.files[0]
                                : input.files
                                ? Array.from(input.files)
                                : null;
                    }
                    break;
                case "checkbox":
                    fieldValue = (e.target as HTMLInputElement).checked;
                    break;
                case "date":
                    fieldValue = value ? new Date(value).toISOString() : null;
                    break;
                case "number":
                    fieldValue = value === "" ? null : Number(value);
                    break;
                default:
                    fieldValue = value;
                    break;
            }

            setValues((prev) => ({ ...prev, [name]: fieldValue }));
            setTouched((prev) => ({ ...prev, [name]: true }));

            if (validateOnChange) {
                const error = await validateField(name as keyof T, fieldValue);
                setErrors((prev) => ({ ...prev, [name]: error }));
            }
        },
        [validateField, validateOnChange]
    );

    const handleBlur = useCallback(
        async (
            e: React.FocusEvent<
                HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
            >
        ) => {
            const { name } = e.target;
            setTouched((prev) => ({ ...prev, [name]: true }));

            if (validateOnBlur) {
                const error = await validateField(
                    name as keyof T,
                    values[name as keyof T]
                );
                setErrors((prev) => ({ ...prev, [name]: error }));
            }
        },
        [validateField, validateOnBlur, values]
    );

    const resetForm = useCallback(() => {
        setValues(initialValues);
        setErrors({});
        setTouched({});
        setIsSubmitting(false);
    }, [initialValues]);

    const handleSubmit = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            setIsSubmitting(() => true);

            const validationErrors = await validateForm();
            setErrors(validationErrors);
            setTouched(
                Object.keys(initialValues).reduce(
                    (acc, key) => ({ ...acc, [key]: true }),
                    {} as FormTouched<T>
                )
            );

            if (Object.keys(validationErrors).length === 0) {
                await onSubmit(values as T, {
                    resetForm,
                    setSubmitting: setIsSubmitting,
                });
            }
            setIsSubmitting(() => false);
        },
        [validateForm, onSubmit, values, initialValues, resetForm]
    );

    const setFieldValue = useCallback(
        (field: keyof T, value: any) => {
            setValues((prev) => ({ ...prev, [field]: value }));
            if (validateOnChange) {
                validateField(field, value).then((error) => {
                    setErrors((prev) => ({ ...prev, [field]: error }));
                });
            }
        },
        [validateField, validateOnChange]
    );

    const setFieldError = useCallback((field: keyof T, error: string) => {
        setErrors((prev) => ({ ...prev, [field]: error }));
    }, []);

    const setFieldTouched = useCallback(
        (field: keyof T, isTouched: boolean) => {
            setTouched((prev) => ({ ...prev, [field]: isTouched }));
        },
        []
    );

    const getFieldProps = useCallback(
        (field: keyof T, type: string = "text") => {
            const baseInputProps = {
                name: field as string,
                onChange: handleChange,
                onBlur: handleBlur,
            };

            switch (type) {
                case "checkbox":
                case "radio":
                    return {
                        inputProps: {
                            ...baseInputProps,
                            checked: !!values[field],
                            type,
                        },
                        meta: { error: errors[field], touched: touched[field] },
                    };
                case "file":
                    return {
                        inputProps: {
                            ...baseInputProps,
                            type,
                            value: undefined,
                        },
                        meta: { error: errors[field], touched: touched[field] },
                    };
                case "date":
                    return {
                        inputProps: {
                            ...baseInputProps,
                            type,
                            value: values[field]
                                ? new Date(values[field])
                                      .toISOString()
                                      .split("T")[0]
                                : "",
                        },
                        meta: { error: errors[field], touched: touched[field] },
                    };
                default:
                    return {
                        inputProps: {
                            ...baseInputProps,
                            value: String(values[field] ?? ""),
                            type,
                        },
                        meta: {
                            error: errors[field],
                            touched: touched[field],
                        },
                    };
            }
        },
        [values, errors, touched, handleChange, handleBlur]
    );

    return useMemo(
        () => ({
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
        }),
        [
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
        ]
    );
}
