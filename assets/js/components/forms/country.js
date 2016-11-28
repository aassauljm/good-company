"use strict";
import React from 'react';
import Input from './input';
import Countries from '../../json/countries.json'

const countryOptions = Countries.map((c, i) => <option key={i} value={c.name}>{c.name}</option>)

export default class Country extends React.Component {
    render() {
        return <Input type="select" {...this.props}>
            { countryOptions }
        </Input>
    }
}
