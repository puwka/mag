"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { City, MenuItem } from "@/lib/types";
import { mediaUrl } from "@/lib/media";
import { CitySelector } from "./TopBar";
import { MainMenu } from "./MainMenu";
import { MobileMenu } from "./MobileMenu";
import { Search } from "./Search";
import { Cart, CartButton } from "./Cart";
import { menuHref } from "@/lib/links";
import { HeaderMessengers } from "./MessengerIcons";

type Props = {
  logo: string;
  logoMobile: string;
  brandAlt: string;
  phones: string[];
  phonesDisplay: string[];
  phonesTel: string[];
  email: string;
  hours: string;
  noCallText: string;
  noCallLabel: string;
  whatsapp: string;
  whatsappMessage: string;
  whatsappSendLabel: string;
  telegram: string;
  max: string;
  telegramLabel: string;
  maxLabel: string;
  searchLabel: string;
  citySelectLabel: string;
  cities: City[];
  megaMenu: MenuItem[];
  quickLinks: MenuItem[];
  mobileMenu: MenuItem[];
};

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function Header(props: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const logo = mediaUrl(props.logo, "site") || props.logo;
  const logoMob = mediaUrl(props.logoMobile, "site") || props.logoMobile;
  const brandAlt = props.brandAlt || "logo";

  const waNumber =
    digitsOnly(props.whatsapp) ||
    digitsOnly(props.phonesTel[0] || "") ||
    digitsOnly(props.phones[0] || "");
  const waText =
    props.whatsappMessage ||
    props.noCallText ||
    "Добрый день! Не смог дозвониться, прошу связаться.";
  const waHref = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(waText)}`
    : null;

  const noCallBtn =
    props.noCallLabel && waHref ? (
      <a
        href={waHref}
        className="btn-link-red"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Написать в WhatsApp"
      >
        {props.noCallLabel}
      </a>
    ) : props.noCallLabel ? (
      <span className="btn-link-red">{props.noCallLabel}</span>
    ) : null;

  return (
    <header className="site-header">
      <div className="top-bar">
        <div className="container top-bar__inner">
          <div className="top-bar__left">
            {noCallBtn}
            {props.email ? (
              <a href={`mailto:${props.email}`} className="top-bar__email">
                {props.email}
              </a>
            ) : null}
          </div>
          <div className="top-bar__phones">
            {props.phonesDisplay.map((p, i) => (
              <a key={p} href={`tel:${props.phonesTel[i] || p}`} className="btn-black-sm">
                {p}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="header-main">
        <div className="container header-main__inner">
          <div className="header-main__left">
            <Link href="/" className="site-logo site-logo--desktop">
              <Image
                src={logo}
                alt={brandAlt}
                width={260}
                height={80}
                priority
                style={{ width: "auto", height: 56 }}
              />
            </Link>
            <CitySelector cities={props.cities} selectLabel={props.citySelectLabel} />
          </div>

          <div className="header-main__center">
            {noCallBtn}
            <div className="header-hours">{props.hours}</div>
          </div>

          <div className="header-main__right">
            <div className="header-contacts">
              {props.phones.map((p, i) => (
                <a key={p} href={`tel:${props.phonesTel[i] || p}`}>
                  {p}
                </a>
              ))}
              <a href={`mailto:${props.email}`}>{props.email}</a>
            </div>
            <HeaderMessengers
              telegram={props.telegram}
              max={props.max}
              telegramLabel={props.telegramLabel}
              maxLabel={props.maxLabel}
            />
            <div className="header-tools header-tools--mobile">
              <CartButton />
              <button
                type="button"
                className="burger"
                onClick={() => setMobileOpen(true)}
                aria-label="Menu"
              >
                ☰
              </button>
            </div>
          </div>

          <Link href="/" className="site-logo site-logo--mobile">
            <Image
              src={logoMob}
              alt={brandAlt}
              width={100}
              height={40}
              style={{ width: 100, height: "auto" }}
            />
          </Link>
        </div>
      </div>

      <div className="header-bottom">
        <div className="container header-bottom__inner">
          <MainMenu items={props.megaMenu} />
          <nav className="quick-links">
            {props.quickLinks.map((l) => {
              const href = menuHref(l.url);
              return href ? (
                <Link key={l.id} href={href}>
                  {l.title}
                </Link>
              ) : (
                <span key={l.id}>{l.title}</span>
              );
            })}
          </nav>
          <div className="header-tools">
            <CartButton />
            {props.searchLabel ? (
              <button
                type="button"
                className="search-trigger"
                onClick={() => setSearchOpen(true)}
              >
                {props.searchLabel}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        items={props.mobileMenu}
        searchSlot={
          props.searchLabel ? (
            <button
              type="button"
              className="mobile-search-trigger"
              onClick={() => {
                setMobileOpen(false);
                setSearchOpen(true);
              }}
            >
              {props.searchLabel}
            </button>
          ) : null
        }
        citySlot={
          <CitySelector cities={props.cities} selectLabel={props.citySelectLabel} />
        }
      />
      <Search open={searchOpen} onClose={() => setSearchOpen(false)} />
      <Cart />
    </header>
  );
}
