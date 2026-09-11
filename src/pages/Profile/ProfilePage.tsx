import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";

import { Avatar } from "../../components/Avatar/Avatar";
import { Button } from "../../components/Button/Button";
import { PadelLoader } from "../../components/PadelLoader/PadelLoader";
import {
  DEFAULT_PHONE_PREFIX,
  joinPhoneNumber,
  PHONE_PREFIXES,
  PROFILE_CATEGORIES,
  PROFILE_GENDERS,
  splitPhoneNumber,
  type ProfileCategory,
  type ProfileGender,
} from "../../constants/profileFields";
import { useSecurity } from "../../context/SecurityContext";
import {
  isConnectionError,
  useConnection,
} from "../../hooks/useConnection";
import { patchMePath } from "../../services/eventsApi";
import type { ApiResponse } from "../../types";
import type { MeProfile } from "../../types/me";
import {
  isProfileNotFoundError,
  profileAvatarSrc,
  profileDisplayName,
} from "../../utils/profileDisplay";
import catalog from "../publicCatalog.module.scss";
import styles from "./ProfilePage.module.scss";

const CATEGORY_HINT =
  "Elegí la categoría que mejor represente tu nivel. Si recién empezás sos 9na.";

export default function ProfilePage() {
  const {
    loading,
    profileLoading,
    profileError,
    isAuthenticated,
    profile,
    user,
    logout,
    refreshProfile,
    applyProfile,
  } = useSecurity();
  const connection = useConnection();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ProfileCategory | null>(null);
  const [gender, setGender] = useState<ProfileGender | null>(null);
  const [phonePrefix, setPhonePrefix] = useState(DEFAULT_PHONE_PREFIX);
  const [phoneNational, setPhoneNational] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const displayName = profileDisplayName(profile, user);

  if (loading || profileLoading) {
    return (
      <main className={catalog.page}>
        <PadelLoader label="Cargando tu perfil..." />
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  function hydrateFromProfile(): void {
    if (!profile) {
      return;
    }

    setName(profile.name);
    setCategory(profile.category);
    setGender(profile.gender);
    const split = splitPhoneNumber(profile.phone_number);
    setPhonePrefix(split.prefix);
    setPhoneNational(split.national);
    setAvatarFile(null);
    setAvatarPreview(null);
  }

  async function handleLogout(): Promise<void> {
    setLogoutBusy(true);
    setLogoutError(null);

    try {
      await logout();
    } catch {
      setLogoutError("No pudimos cerrar la sesión. Probá de nuevo.");
      setLogoutBusy(false);
    }
  }

  function startEdit(): void {
    hydrateFromProfile();
    setNameError(null);
    setSaveError(null);
    setSaveSuccess(false);
    setEditing(true);
  }

  function cancelEdit(): void {
    setEditing(false);
    setNameError(null);
    setSaveError(null);
    setAvatarFile(null);
    setAvatarPreview(null);
  }

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0] ?? null;
    setAvatarFile(file);
    setAvatarPreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const trimmed = name.trim();

    if (!trimmed) {
      setNameError("Ingresá tu nombre.");
      return;
    }

    setSaving(true);
    setNameError(null);
    setSaveError(null);
    setSaveSuccess(false);

    const phone_number = joinPhoneNumber(phonePrefix, phoneNational);
    const fields = {
      name: trimmed,
      category,
      gender,
      phone_number,
    };

    const result = avatarFile
      ? await connection<ApiResponse<MeProfile>>({
          method: "PATCH",
          url: patchMePath(),
          body: (() => {
            const form = new FormData();
            form.append("name", fields.name);
            form.append("category", fields.category ?? "");
            form.append("gender", fields.gender ?? "");
            form.append("phone_number", fields.phone_number ?? "");
            form.append("image", avatarFile);
            return form;
          })(),
        })
      : await connection<ApiResponse<MeProfile>>({
          method: "PATCH",
          url: patchMePath(),
          body: fields,
        });

    setSaving(false);

    if (isConnectionError(result)) {
      setSaveError(result.message);
      return;
    }

    applyProfile(result.data);
    setEditing(false);
    setAvatarFile(null);
    setAvatarPreview(null);
    setSaveSuccess(true);
  }

  const incomplete =
    Boolean(profileError) &&
    profileError !== null &&
    isProfileNotFoundError(profileError);

  const shownName = editing ? name : (profile?.name ?? "");
  const shownCategory = editing ? category : (profile?.category ?? null);
  const shownGender = editing ? gender : (profile?.gender ?? null);
  const shownPhone = editing
    ? { prefix: phonePrefix, national: phoneNational }
    : splitPhoneNumber(profile?.phone_number ?? null);
  const shownAvatar = editing
    ? avatarPreview || profileAvatarSrc(profile, user)
    : profileAvatarSrc(profile, user);

  return (
    <main className={catalog.page}>
      <header className={catalog.masthead}>
        <h1>Mi perfil</h1>
        <p className={catalog.lede}>
          Tus datos de la cuenta. El email viene de Google y no se puede
          cambiar acá.
        </p>
      </header>

      {profileError && !incomplete ? (
        <div
          className={catalog.error}
          role="alert"
        >
          <p>{profileError.message}</p>
          <Button onClick={() => void refreshProfile()}>Reintentar</Button>
        </div>
      ) : null}

      {incomplete ? (
        <div
          className={catalog.error}
          role="status"
        >
          <h2>Tu perfil todavía no está completo</h2>
          <p>
            Todavía no tenemos una cuenta de perfil en el sistema. Cuando esté
            lista vas a poder inscribirte en los eventos.
          </p>
          <Link
            className={catalog.back}
            to="/"
          >
            Volver al inicio
          </Link>
        </div>
      ) : null}

      {saveSuccess ? (
        <p
          className={styles.success}
          role="status"
          aria-live="polite"
        >
          Perfil actualizado.
        </p>
      ) : null}

      {profile ? (
        <form
          className={styles.form}
          onSubmit={(event) => void handleSave(event)}
        >
          <div className={styles.hero}>
            <div className={styles.avatarWrap}>
              <Avatar
                src={shownAvatar}
                name={displayName}
                size="lg"
              />
              {editing ? (
                <>
                  <input
                    ref={fileInputRef}
                    className={styles.fileInput}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleAvatarChange}
                    disabled={saving}
                  />
                  <button
                    type="button"
                    className={styles.avatarEdit}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={saving}
                    aria-label="Cambiar foto de perfil"
                  >
                    <PencilIcon />
                  </button>
                </>
              ) : null}
            </div>
            <div className={styles.heroActions}>
              {!editing ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={startEdit}
                >
                  Editar perfil
                </Button>
              ) : null}
              <Button
                type="button"
                variant="danger"
                onClick={() => void handleLogout()}
                disabled={logoutBusy}
                loading={logoutBusy}
                loadingText="Cerrando sesión…"
              >
                Cerrar sesión
              </Button>
            </div>
          </div>

          {profile.role === "admin" ? (
            <p className={styles.role}>Admin</p>
          ) : null}

          {logoutError ? (
            <p
              className={styles.fieldError}
              role="alert"
            >
              {logoutError}
            </p>
          ) : null}

          <div className={styles.field}>
            <label
              className={styles.label}
              htmlFor="profile-email"
            >
              Email de registro
            </label>
            <div className={styles.emailWrap}>
              <span
                className={styles.emailIcon}
                aria-hidden="true"
              >
                @
              </span>
              <input
                id="profile-email"
                className={styles.input}
                type="email"
                value={user?.email ?? "Sin email"}
                disabled
                readOnly
              />
            </div>
          </div>

          <div className={styles.field}>
            <label
              className={styles.label}
              htmlFor="profile-name"
            >
              Nombre y apellido
            </label>
            <input
              id="profile-name"
              className={styles.input}
              type="text"
              name="name"
              value={shownName}
              onChange={(event) => {
                setName(event.target.value);
                setNameError(null);
              }}
              disabled={!editing || saving}
              maxLength={120}
              aria-invalid={Boolean(nameError)}
              aria-describedby={nameError ? "profile-name-error" : undefined}
            />
            {nameError ? (
              <p
                id="profile-name-error"
                className={styles.fieldError}
                role="alert"
              >
                {nameError}
              </p>
            ) : null}
          </div>

          <div className={styles.field}>
            <label
              className={styles.label}
              htmlFor="profile-phone"
            >
              Teléfono
            </label>
            <div className={styles.phoneRow}>
              <select
                className={styles.prefix}
                value={shownPhone.prefix}
                onChange={(event) => setPhonePrefix(event.target.value)}
                disabled={!editing || saving}
                aria-label="Prefijo de país"
              >
                {PHONE_PREFIXES.map((item) => (
                  <option
                    key={item.id}
                    value={item.code}
                  >
                    {item.label}
                  </option>
                ))}
              </select>
              <input
                id="profile-phone"
                className={styles.input}
                type="tel"
                inputMode="tel"
                value={shownPhone.national}
                onChange={(event) => setPhoneNational(event.target.value)}
                disabled={!editing || saving}
                maxLength={16}
                autoComplete="tel-national"
              />
            </div>
          </div>

          <fieldset className={styles.fieldset}>
            <legend className={styles.label}>Categoría</legend>
            <div
              className={styles.chips}
              role="radiogroup"
              aria-label="Categoría"
              aria-describedby="profile-category-hint"
            >
              {PROFILE_CATEGORIES.map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={shownCategory === value}
                  className={
                    shownCategory === value ? styles.chipSelected : styles.chip
                  }
                  disabled={!editing || saving}
                  onClick={() => setCategory(value)}
                >
                  {value}
                </button>
              ))}
            </div>
            <p
              id="profile-category-hint"
              className={styles.hint}
            >
              {CATEGORY_HINT}
            </p>
          </fieldset>

          <fieldset className={styles.fieldset}>
            <legend className={styles.label}>Sexo</legend>
            <div
              className={styles.chips}
              role="radiogroup"
              aria-label="Sexo"
            >
              {PROFILE_GENDERS.map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={shownGender === value}
                  className={
                    shownGender === value ? styles.chipSelected : styles.chip
                  }
                  disabled={!editing || saving}
                  onClick={() => setGender(value)}
                >
                  {value}
                </button>
              ))}
            </div>
          </fieldset>

          {saveError ? (
            <p
              className={styles.fieldError}
              role="alert"
            >
              {saveError}
            </p>
          ) : null}

          {editing ? (
            <div className={styles.actions}>
              <Button
                type="button"
                variant="secondary"
                onClick={cancelEdit}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                loading={saving}
                loadingText="Guardando…"
              >
                Guardar
              </Button>
            </div>
          ) : null}
        </form>
      ) : null}
    </main>
  );
}

function PencilIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 20h4.5L19 9.5 14.5 5 4 15.5V20z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
