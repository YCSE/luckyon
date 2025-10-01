/**
 * Input validation utilities
 */
import Joi from 'joi';
import { AppError } from './errors';
import { ErrorCode } from '../config/constants';

// 이메일 검증 스키마
export const emailSchema = Joi.string().email().required();

// 비밀번호 검증 스키마 (최소 8자)
export const passwordSchema = Joi.string().min(8).required();

// 이름 검증 스키마
export const nameSchema = Joi.string().min(2).max(50).required();

// 전화번호 검증 스키마 (010-XXXX-XXXX)
export const phoneNumberSchema = Joi.string().pattern(/^010-\d{4}-\d{4}$/).optional();

// 레퍼럴 코드 검증 스키마 (8자리 영문+숫자)
export const referralCodeSchema = Joi.string().length(8).pattern(/^[A-Z0-9]{8}$/).optional().allow(null, '');

// 생년월일 검증 스키마 (YYYY-MM-DD)
export const birthDateSchema = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required();

// 생시 검증 스키마 (HH:MM)
export const birthTimeSchema = Joi.string().pattern(/^\d{2}:\d{2}$/).optional();

// 사용자 회원가입 검증
export const validateSignupData = (data: any): void => {
  const schema = Joi.object({
    email: emailSchema,
    password: passwordSchema,
    displayName: nameSchema,
    phoneNumber: phoneNumberSchema,
    referralCode: referralCodeSchema
  });

  const { error } = schema.validate(data);
  if (error) {
    throw new AppError(ErrorCode.SVC003, `입력값 검증 실패: ${error.details[0].message}`);
  }
};

// 사용자 로그인 검증
export const validateLoginData = (data: any): void => {
  const schema = Joi.object({
    email: emailSchema,
    password: passwordSchema
  });

  const { error } = schema.validate(data);
  if (error) {
    throw new AppError(ErrorCode.SVC003, `입력값 검증 실패: ${error.details[0].message}`);
  }
};

// 오늘의 운세 입력 검증
export const validateTodayFortuneData = (data: any): void => {
  const schema = Joi.object({
    name: nameSchema,
    birthDate: birthDateSchema
  });

  const { error } = schema.validate(data);
  if (error) {
    throw new AppError(ErrorCode.SVC003, `입력값 검증 실패: ${error.details[0].message}`);
  }
};

// 사주팔자 입력 검증
export const validateSajuData = (data: any): void => {
  const schema = Joi.object({
    name: nameSchema,
    birthDate: birthDateSchema,
    birthTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required()
  });

  const { error } = schema.validate(data);
  if (error) {
    throw new AppError(ErrorCode.SVC003, `입력값 검증 실패: ${error.details[0].message}`);
  }
};

// 토정비결 입력 검증
export const validateTojungData = (data: any): void => {
  const schema = Joi.object({
    name: nameSchema,
    birthDate: birthDateSchema,
    lunarCalendar: Joi.boolean().required()
  });

  const { error } = schema.validate(data);
  if (error) {
    throw new AppError(ErrorCode.SVC003, `입력값 검증 실패: ${error.details[0].message}`);
  }
};

// 궁합 입력 검증
export const validateCompatibilityData = (data: any): void => {
  const schema = Joi.object({
    name: nameSchema,
    birthDate: birthDateSchema,
    partnerName: nameSchema,
    partnerBirthDate: birthDateSchema
  });

  const { error } = schema.validate(data);
  if (error) {
    throw new AppError(ErrorCode.SVC003, `입력값 검증 실패: ${error.details[0].message}`);
  }
};

// 재물운 입력 검증
export const validateWealthData = (data: any): void => {
  const schema = Joi.object({
    name: nameSchema,
    birthDate: birthDateSchema,
    jobType: Joi.string().required()
  });

  const { error } = schema.validate(data);
  if (error) {
    throw new AppError(ErrorCode.SVC003, `입력값 검증 실패: ${error.details[0].message}`);
  }
};

// 연애운 입력 검증
export const validateLoveData = (data: any): void => {
  const schema = Joi.object({
    name: nameSchema,
    birthDate: birthDateSchema,
    gender: Joi.string().valid('male', 'female').required(),
    relationshipStatus: Joi.string().valid('single', 'dating', 'married', 'divorced').required()
  });

  const { error } = schema.validate(data);
  if (error) {
    throw new AppError(ErrorCode.SVC003, `입력값 검증 실패: ${error.details[0].message}`);
  }
};