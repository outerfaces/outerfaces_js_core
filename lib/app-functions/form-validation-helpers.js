/**
 * Form Validation Helpers
 * Provides reusable validation rules and utilities for form fields
 */

/**
 * Validation rules for common field types
 * Each rule defines min/max length, pattern regex, and error messages
 */
export const VALIDATION_RULES = {
  name: {
    minLength: 1,
    maxLength: 255,
    pattern: /^[a-zA-Z0-9\s\-_.]+$/,
    label: 'Name',
    messages: {
      required: 'Name is required',
      tooLong: 'Name is too long (max 255 characters)',
      invalidFormat: 'Name can only contain letters, numbers, spaces, hyphens, underscores, and periods'
    }
  },
  description: {
    minLength: 0,
    maxLength: 500,
    pattern: null, // No pattern restriction for descriptions
    label: 'Description',
    messages: {
      tooLong: 'Description is too long (max 500 characters)'
    }
  },
  title: {
    minLength: 1,
    maxLength: 255,
    pattern: /^[a-zA-Z0-9\s\-_.]+$/,
    label: 'Title',
    messages: {
      required: 'Title is required',
      tooLong: 'Title is too long (max 255 characters)',
      invalidFormat: 'Title can only contain letters, numbers, spaces, hyphens, underscores, and periods'
    }
  },
  email: {
    minLength: 1,
    maxLength: 255,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    label: 'Email',
    messages: {
      required: 'Email is required',
      invalidFormat: 'Email must be a valid email address'
    }
  }
};

/**
 * Validate a field value against a rule
 * @param {string} fieldName - The field name (must exist in VALIDATION_RULES)
 * @param {string} value - The value to validate
 * @returns {{isValid: boolean, errorMessage: string}} - Validation result
 */
export function validateField(fieldName, value) {
  const rule = VALIDATION_RULES[fieldName];

  if (!rule) {
    console.warn(`No validation rule found for field: ${fieldName}`);
    return { isValid: true, errorMessage: '' };
  }

  const trimmedValue = value.trim();

  // Check if required and empty
  if (rule.minLength > 0 && trimmedValue.length === 0) {
    return {
      isValid: false,
      errorMessage: rule.messages.required || `${rule.label} is required`
    };
  }

  // Check max length
  if (trimmedValue.length > rule.maxLength) {
    return {
      isValid: false,
      errorMessage: rule.messages.tooLong || `${rule.label} is too long (max ${rule.maxLength} characters)`
    };
  }

  // Check pattern if specified
  if (rule.pattern && trimmedValue.length > 0 && !rule.pattern.test(trimmedValue)) {
    return {
      isValid: false,
      errorMessage: rule.messages.invalidFormat || `${rule.label} format is invalid`
    };
  }

  return { isValid: true, errorMessage: '' };
}

/**
 * Format error messages from backend (handles both string and array)
 * @param {string|string[]} errors - Error message(s) from backend
 * @returns {string} - Formatted error message
 */
export function formatErrorMessage(errors) {
  if (Array.isArray(errors)) {
    return errors.join(', ');
  }
  return errors || '';
}

/**
 * Apply validation state to a form field
 * @param {HTMLElement} fieldContainer - The form-group element
 * @param {boolean} isValid - Whether the field is valid
 * @param {string} errorMessage - Error message to display
 */
export function applyValidationState(fieldContainer, isValid, errorMessage = '') {
  if (!fieldContainer) return;

  if (isValid) {
    fieldContainer.classList.remove('has-error');
    const errorEl = fieldContainer.querySelector('.error');
    if (errorEl) {
      errorEl.textContent = '';
    }
  } else {
    fieldContainer.classList.add('has-error');
    let errorEl = fieldContainer.querySelector('.error');

    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.className = 'error';
      fieldContainer.appendChild(errorEl);
    }

    errorEl.textContent = errorMessage;
  }
}

/**
 * Validate all fields in a form definition
 * @param {Object} formElement - The form DOM element
 * @param {Object} fieldDefinitions - Map of field names to their config {inputSelector, groupSelector}
 * @returns {boolean} - True if all fields are valid
 */
export function validateForm(formElement, fieldDefinitions) {
  let allValid = true;

  Object.entries(fieldDefinitions).forEach(([fieldName, config]) => {
    const input = formElement.querySelector(config.inputSelector);
    const group = formElement.querySelector(config.groupSelector);

    if (input) {
      const { isValid, errorMessage } = validateField(fieldName, input.value);
      applyValidationState(group, isValid, errorMessage);

      if (!isValid) {
        allValid = false;
      }
    }
  });

  return allValid;
}

/**
 * Setup real-time validation for a field
 * @param {HTMLElement} formElement - The form DOM element
 * @param {string} fieldName - The field name
 * @param {Object} config - Configuration {inputSelector, groupSelector}
 */
export function setupFieldValidation(formElement, fieldName, config) {
  const input = formElement.querySelector(config.inputSelector);

  if (input) {
    input.addEventListener('input', () => {
      const { isValid, errorMessage } = validateField(fieldName, input.value);
      const group = formElement.querySelector(config.groupSelector);
      applyValidationState(group, isValid, errorMessage);
    });
  }
}

/**
 * Apply backend validation errors to form fields
 * @param {HTMLElement} formElement - The form DOM element
 * @param {Object} errors - Backend error response {fieldName: errorMessage|errorMessages[]}
 * @param {Object} fieldDefinitions - Map of field names to their config {inputSelector, groupSelector}
 */
export function applyBackendErrors(formElement, errors, fieldDefinitions) {
  if (!errors || typeof errors !== 'object') {
    return;
  }

  Object.entries(errors).forEach(([fieldName, errorData]) => {
    const config = fieldDefinitions[fieldName];
    if (config) {
      const group = formElement.querySelector(config.groupSelector);
      const errorMessage = formatErrorMessage(errorData);
      applyValidationState(group, false, errorMessage);
    }
  });
}

/**
 * Clear all validation errors from a form
 * @param {HTMLElement} formElement - The form DOM element
 */
export function clearValidationErrors(formElement) {
  formElement.querySelectorAll('.form-group').forEach(group => {
    group.classList.remove('has-error');
    const errorEl = group.querySelector('.error');
    if (errorEl) {
      errorEl.textContent = '';
    }
  });
}
