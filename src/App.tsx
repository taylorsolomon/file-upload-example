import React, { Component, RefObject, FormEvent } from 'react';

import logo from './logo.svg';
import './App.css';

import ReactCrop from 'react-image-crop';
import 'react-image-crop/lib/ReactCrop.scss';

class App extends Component {
  fileInput: RefObject<HTMLInputElement>;
  imageRef: RefObject<HTMLImageElement>;

  state: {
    toCrop: any;
    crop: any;
    pixelCrop: any;
    imageURL: string | null;
  };

  constructor(props: any) {
    super(props);

    this.handleUpload = this.handleUpload.bind(this);
    this.onCrop = this.onCrop.bind(this);
    this.handleSubmitCroppedImage = this.handleSubmitCroppedImage.bind(this);
    this.onImageLoaded = this.onImageLoaded.bind(this);

    this.fileInput = React.createRef();
    this.imageRef = React.createRef();

    this.state = {
      toCrop: null,
      crop: {
        aspect: 1,
        width: 50,
        x: 0,
        y: 0
      },
      pixelCrop: null,
      imageURL: null
    };
  }

  handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      this.fileInput.current &&
      this.fileInput.current.files &&
      this.fileInput.current.files.length
    ) {
      const file = this.fileInput.current.files[0];
      this.setState({ toCrop: URL.createObjectURL(file) });
    }
  }

  onCrop(crop: ReactCrop.Crop, pixelCrop: ReactCrop.PixelCrop) {
    this.setState({ crop, pixelCrop });
  }

  getCroppedImg(image: any, pixelCrop: ReactCrop.PixelCrop) {
    const canvas = document.createElement('canvas');
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext('2d');

    ctx!.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (blob === null) {
          return reject();
        }
        resolve(blob);
      }, 'image/jpeg');
    });
  }

  onImageLoaded(image: any) {
    this.imageRef = image;
  }

  async handleSubmitCroppedImage(event: any) {
    const file = (await this.getCroppedImg(
      this.imageRef,
      this.state.pixelCrop
    )) as Blob;

    const formData = new FormData();
    formData.append('image', file, this.fileInput.current!.files![0].name);

    await fetch('http://localhost:4200/upload', {
      method: 'post',
      body: formData
    })
      .then(response => response.json())
      .catch(error => console.error('Error:', error))
      .then(response => {
        this.setState({ imageURL: response.url });
      });
  }

  render() {
    const { toCrop, crop, imageURL } = this.state;

    return (
      <div className="App">
        <header className="App-header">
          {toCrop && (
            <div>
              <ReactCrop
                crop={crop}
                src={toCrop}
                onImageLoaded={this.onImageLoaded}
                onChange={this.onCrop}
              />
              <button type="submit" onClick={this.handleSubmitCroppedImage}>
                Upload to S3
              </button>
            </div>
          )}

          <form onSubmit={this.handleUpload}>
            <div>
              <label htmlFor="profile-image">Upload a profile image</label>
            </div>
            <input
              name="profile-image"
              type="file"
              accept="image/png, image/jpeg"
              ref={this.fileInput}
            />
            <button type="submit">Crop</button>
          </form>

          {imageURL && (<img src={imageURL} alt="profile image" />)}

        </header>
      </div>
    );
  }
}

export default App;
