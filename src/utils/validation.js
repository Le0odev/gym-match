// Validação de email
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validação de senha
export const validatePassword = (password) => {
  return password.length >= 6;
};

// Validação de nome
export const validateName = (name) => {
  return name.trim().length >= 2;
};

// Validação de altura
export const validateHeight = (height) => {
  const heightNum = parseFloat(height);
  return !isNaN(heightNum) && heightNum >= 100 && heightNum <= 250;
};

// Validação de peso
export const validateWeight = (weight) => {
  const weightNum = parseFloat(weight);
  return !isNaN(weightNum) && weightNum >= 30 && weightNum <= 300;
};

// Validação de idade
export const validateAge = (age) => {
  const ageNum = parseInt(age);
  return !isNaN(ageNum) && ageNum >= 16 && ageNum <= 100;
};

// Validação de formulário de registro
export const validateRegistrationForm = (formData) => {
  const errors = {};

  if (!validateName(formData.name)) {
    errors.name = 'Nome deve ter pelo menos 2 caracteres';
  }

  if (!validateEmail(formData.email)) {
    errors.email = 'Email inválido';
  }

  if (!validatePassword(formData.password)) {
    errors.password = 'Senha deve ter pelo menos 6 caracteres';
  }

  if (formData.height && !validateHeight(formData.height)) {
    errors.height = 'Altura deve estar entre 100 e 250 cm';
  }

  if (formData.weight && !validateWeight(formData.weight)) {
    errors.weight = 'Peso deve estar entre 30 e 300 kg';
  }

  if (formData.age && !validateAge(formData.age)) {
    errors.age = 'Idade deve estar entre 16 e 100 anos';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Validação de formulário de login
export const validateLoginForm = (formData) => {
  const errors = {};

  if (!validateEmail(formData.email)) {
    errors.email = 'Email inválido';
  }

  if (!validatePassword(formData.password)) {
    errors.password = 'Senha deve ter pelo menos 6 caracteres';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

